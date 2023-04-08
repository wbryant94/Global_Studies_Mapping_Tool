import {db} from '../db.js'
import bcrypt from 'bcryptjs'
import jwt from "jsonwebtoken"



export const register = (req, res) => {
  /*   console.log('hit beginning of register function') */
    //CHECK EXISTING USER
    const q = "SELECT * FROM admin WHERE email = ? ";
  
    db.query(q, [req.body.email], (err, data) => {
      if (err) return res.status(500).json(err);

   
      //Check if user exists
      if (data.length) return res.status(409).json("User already exists!");
  
      //Hash the password and create a user
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(req.body.password, salt);
  
      console.log("at insert")
      const q = "INSERT INTO admin(`fname`,`lname`, `email`,`password`) VALUES (?)";
      const values = [req.body.fname,req.body.lname, req.body.email, hash];
  
      db.query(q, [values], (err, data) => {
        if (err) {
          console.log("error in admin:register query:"+err)
          return res.status(500).json(err);
        }

        return res.status(200).json("User has been created.");
      });
    });
  };


export const login = (req, res) => { 
     const q = "SELECT * FROM admin WHERE email = ?";

     db.query(q, [req.body.email], (err, data) => {
      if (err) return res.status(500).json(err);

      if (data.length === 0) { 
        return (res.status(404).json('email not found!'))
      }

      const isPasswordCorrect = bcrypt.compareSync(
        req.body.password, 
        data[0].password
        );

      if (!isPasswordCorrect) {
        return res.status(400).json("Wrong username or password");
      }

      // kept in cookies for length of session //  
      const token = jwt.sign({ id: data[0].id }, "jwtkey");
      const { password, ...other } = data[0];
  
      res.cookie("access_token", token, {
          httpOnly: true,
        }).status(200).json(other);
    });
  };
  

  export const logout = (req, res) => { 
    console.log('in logout call');
    
    res.clearCookie("access_token", {
      sameSite: "none",
      secure:true
    }).status(200).json("user has been logged out");

  }