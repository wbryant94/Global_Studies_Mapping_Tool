import jwt from "jsonwebtoken";
import { db } from "../db.js";

// get all professors //
export const getProfessors = (req, res) => {
  console.log("testing",req.params.selection)
  const q = "SELECT * FROM professors"

  db.query(q, (err, data) => {
    if (err) return res.send(err);
    return res.status(200).json(data);
  });
};

// get all professors //
export const getProfessorDepartment = (req, res) => {
  const id = req.params.id 
  
  const q = req.params.id && req.params.id !== 'All Departments'
  ? "SELECT * FROM professors WHERE department=?" 
  : "SELECT * FROM professors"
  
  db.query(q, id, (err, data) => {
    if (err) return res.send(err);
    return res.status(200).json(data);
  });
};

//get all countries, for dropdown prompt selection //
export const getCountries = (req, res) => {

  const q = "SELECT * FROM countries";
  db.query(q, (err, data) => {
    if (err) return res.send(err);
    return res.status(200).json(data);
  });
};


export const getProfCountries = (req, res) => {
  /*   console.log("reached getProfCountries (by id) call"); */
  const q = `SELECT name, countries.country_id FROM professors as p 
    JOIN connections  
    ON  connections.professor_id = ?  
    JOIN countries 
    ON connections.country_id = countries.country_id 
    WHERE connections.professor_id = p.professor_id`;
console.log("req.body:",req.params)

  const id = req.params.id;
  db.query(q, id, (err, data) => {
    if (err) {
      console.log("error:", err);
      return res.status(500).json(err);
    }
    console.log("data: ",data)
    return res.status(200).json(data);
  });
};

export const addProfessor = async (req, res) => {
  /*   console.log("top of add professor, checking token")
  const token = req.cookies.access_token;
  console.log(token)
  if (!token) return res.status(401).json("Not authenticated!");
 */
  // check if Professor already exists based upon email as a pseudo - PK
  const checkQuery = "SELECT * FROM professors WHERE email = ?";

  const [result, fieldData] = await db
    .promise()
    .query(checkQuery, [req.body.email]);


  if (result.length) {
    console.log("result:", result[0].professor_id);
    return res.status(409).json({
      professor: result[0],
      message: "Professor Already Exists With Email: "+req.body.email 
  });
  }

  const insertQuery =
    "INSERT INTO professors(`fname`,`lname`, `department`, `description`, `email`, `image`) VALUES (?)";
  const values = [
    req.body.fname,
    req.body.lname,
    req.body.department,
    req.body.description,
    req.body.email,
    req.body.image,
  ];

  db.query(insertQuery, [values], (err, data) => {
    console.log("made it to insert");
    console.log("values: ", req.body);
    if (err) {
      return res.status(500).json(err);
    }

    return res
      .status(200)
      .json({ message: "Resource has been created.", insertId: data.insertId });
  });
};

const queryBuilder = (id, countryIds) => {
  console.log("starting values to add:", countryIds);
  let query = "";
  for (let i = 0; i < 1; i++) {
    for (let country = 0; country < countryIds.length; country++) {
      if (country === countryIds.length - 1) {
        query += `(${id},${countryIds[country]})`;
      } else {
        query += `(${id},${countryIds[country]}),`;
      }
    }
  }
  console.log("finished query: ", query);
  return query;
};

//Adds one or more to connections (linking a prof->country) to table during initial addProfessor
export const addResource = (req, res) => {
  const countryIds = Object.values(req.body.country).map(
    (item) => item.country_id
  );
  const professor_id = req.body.professor_id;
  const query = queryBuilder(professor_id, countryIds);
  const addQuery =
    "INSERT INTO connections (professor_id, country_id) VALUES" + query;
  db.query(addQuery, (err, data) => {
    if (err) {
      console.log("error in resource/addResource:" + err);
      return res.status(500).json(err);
    }
  
    return res.status(200).json("Resource has been created.");
  });
};

// Deletes from professors table and removes any ids in connections table
export const deleteProfessor = (req, res) => {
  /*     const token = req.cookies.access_token;
    if (!token) return res.status(401).json("Not authenticated!");
   */

  console.log("in delete prof call");
  const professor_id = req.params.id;
  const q = "DELETE FROM professors WHERE `professor_id` = ?";
  db.query(q, [professor_id], (err, data) => {
    if (err) return res.status(500).json("You can delete only your post!");
    return res.json("Post has been deleted!");
  });
};

// Updates all fields in professors table, updating connections handled separately
export const updateProfessor = async (req, res) => {
  /*   console.log("top of add professor, checking token")
    const token = req.cookies.access_token;
    console.log(token)
    if (!token) return res.status(401).json("Not authenticated!");
   */
    console.log("request:",req.body)
    const checkQuery = "SELECT * FROM professors WHERE email = ?";

    const [result, fieldData] = await db
      .promise()
      .query(checkQuery, [req.body.email]);


  
      if (result.length && result[0].professor_id != req.body.professor_id) {
        console.log("result:", result[0].professor_id);
        return res.status(409).json({
          message: "Professor Already Exists With Email: "+req.body.email 
      });
      }
  

  const updateQuery = `UPDATE professors SET fname='${req.body.fname}', lname='${req.body.lname}',department='${req.body.department}',description='${req.body.description}',email='${req.body.email}',image='${req.body.image}' WHERE professor_id=${req.body.professor_id}`;

  console.log("query: ",req.body)
  db.query(updateQuery, (err, data) => {
    if (err) {
      console.log("err:", err);
      return res.status(500).json(err);
    }
    console.log("Successfully Updated Professor Details.");
    return res
      .status(200)
      .json({ message: "Professor Details Successfully Updated." });
  });
};

export const updateConnection = async (req, res) => {
  const id = req.body.professor_id;
console.log("req body:",req.body)
  //get current list of connections / their ids
  const currentConnectionsQuery = `SELECT connections.connection_id, connections.country_id FROM professors as p JOIN connections  ON  connections.professor_id = p.professor_id  WHERE p.professor_id = ?`;
  const [result, fieldData] = await db
    .promise()
    .query(currentConnectionsQuery, id);
  // Get arrays of both newVals and old Vals, clean any duplicates/other problem data
  let newVals = req.body.countries.map((item) => item.value);
  console.log("newVals after map:",newVals)
  newVals = [...new Set(newVals)];
  newVals = newVals.filter(function (x) {
    return x !== undefined;
  });

  // map Ids to array to filter
  const originalVals = result.map((item) => item.country_id);
/*   console.log("Curent connections from check function: ", originalVals); */
  let toAdd = newVals.filter((x) => !originalVals.includes(x));
  let toDelete = originalVals.filter((x) => !newVals.includes(x));
  toDelete = toDelete.join(",");
  console.log("toDelete formatted:", toDelete);

  // build query for update (add)
  const query = queryBuilder(id, toAdd);
  const addResourcesQuery =
  "INSERT INTO connections (professor_id, country_id) VALUES" + query;
  console.log("Add resource query: ", addResourcesQuery);

  const deleteResourcesQuery = `DELETE FROM connections WHERE professor_id = ${id} AND country_id IN (${toDelete})`;
  console.log("deleteResource:", deleteResourcesQuery);

if (query.length > 0) { 
  db.query(addResourcesQuery, (err, data) => {
    console.log("top of add resource update");
    if (err) {
      console.log("error:", err);
      return res.status(500).json(err);
    }
    console.log("Connections Updated Successfully: ", data);
  });
}

if (toDelete.length > 0) { 
console.log("going into delete statement for update");
db.query(deleteResourcesQuery, (err, data) => {
  console.log("data:", data);
  if (err) {
    console.log("error:", err);
    return res.status(500).json(err);
  }
  console.log("Succesfully deleted old connections.");
  return res.status(200).json(data);
});
}
console.log("no values to delete")
};
//get all countries that have connections // 
export const getConnectedCountries = (req, res) => {
  const q = 
  `SELECT c.name, c.country_id, p.* FROM countries as c 
  JOIN connections 
  ON connections.country_id = c.country_id 
  JOIN professors as p ON connections.professor_id = p.professor_id `
 
  db.query(q,  (err, data) => {
    if (err) return res.send(err);
    return res.status(200).json(data);
  });
};
