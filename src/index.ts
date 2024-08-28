import express, { Request, Response, NextFunction } from "express";
import mysql from "mysql2/promise";
import { z } from "zod";
const app = express();
app.use(express.json());
var connection: any;
const connectionString =
  "mysql://avnadmin:AVNS_RqoMX03OxKV2jqcpXYQ@mysql-284f063a-rsounak55-059d.f.aivencloud.com:12419/backend?ssl-mode=REQUIRED";
//middleware to connect to database
async function connect(req: Request, res: Response, next: NextFunction) {
  connection = await mysql.createConnection(connectionString);
  console.log(typeof connection);
  next();
}
app.post("/addSchool", connect, async (req: Request, res: Response) => {
  const body = req.body;
  //zod type checking
  var schema = z.object({
    name:z.string().min(1),
    address:z.string().min(1),
    latitude:z.number(),
    longitude:z.number(),
  })
  var check = schema.safeParse(body)
  if(check.success){
    try {
      const query = `CREATE TABLE IF NOT EXISTS Schools (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      address VARCHAR(255) NOT NULL,
      latitude FLOAT NOT NULL,
      longitude FLOAT NOT NULL
  );
  `;
      const data = await connection.execute(query);
      try {
        const query = `INSERT INTO Schools (name,  address,latitude,longitude)
              VALUES (?,?,?,?);`;
        const data = await connection.execute(query, [
          body.name,
          body.address,
          body.latitude,
          body.longitude,
        ]);
        res.json("School added successfully");
      } catch (err) {
        res.json(err);
      }
    } catch (err) {
      res.json(err);
    }
  }
  else{
    return res.send("Wrong fomat in data")
  }

});
function toRadians(degrees: number) {
  return degrees * (Math.PI / 180);
}
app.get("/listSchool", connect, async (req: Request, res: Response) => {
  const query = `SELECT * FROM Schools`;
  var latitude1: number = Number(req.headers.latitude);
  var longitude1: number = Number(req.headers.longitude);
  const lat2 = toRadians(latitude1);
  const lon2 = toRadians(longitude1);
  var data = await connection.execute(query);
   var sorted_list = data[0].filter((item: any) => {
    const lat1 = toRadians(item.latitude);
    const lon1 = toRadians(item.longitude);
    var dist =Math.acos(Math.sin(lat1) * Math.sin(lat2) +Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)
      ) * 6371;

    if (dist <= 100) {
      return {
        name:item.name,
        address:item.address,
        distance:`${dist} kms`
      }
    }
    else{
        return
    }
  });
  if (sorted_list.length !=0) {
    res.send(sorted_list);
  }
     else{
        res.send("No schools in proximity")
     }
});
app.listen(3000);


