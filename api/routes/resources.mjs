import express from "express";
import { addResource, 
    deleteProfessor, 
    getProfCountries, 
    getProfessors, 
    updateProfessor, 
    updateConnection, 
    addProfessor, 
    getCountries,
    getProfessorDepartment,
    getConnectedCountries } 
    from '../controllers/resource.js'

const router = express.Router();

router.get("/countries", getCountries)
 router.get("/", getProfessors)
 // Issue with this request since routes are going sequentially, need to change identifier? Was fetching getProfCountries before it would get all countries. 
 router.get("/map/connections", getConnectedCountries)
 router.get("/professor/department/:id", getProfessorDepartment)
 router.get("/professor/:id", getProfCountries)
 router.post("/", addResource)
 router.post("/professor", addProfessor)
 router.delete("/:id", deleteProfessor)
 router.put("/professor/:id", updateProfessor)
 router.put("/:id", updateConnection)


export default router;