"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const promise_1 = __importDefault(require("mysql2/promise"));
const zod_1 = require("zod");
const app = (0, express_1.default)();
app.use(express_1.default.json());
var connection;
const connectionString = process.env.DATABASE_URL;
//middleware to connect to database
function connect(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        connection = yield promise_1.default.createConnection(connectionString);
        console.log(typeof connection);
        next();
    });
}
app.post("/addSchool", connect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    //zod type checking
    var schema = zod_1.z.object({
        name: zod_1.z.string().min(1),
        address: zod_1.z.string().min(1),
        latitude: zod_1.z.number(),
        longitude: zod_1.z.number(),
    });
    var check = schema.safeParse(body);
    if (check.success) {
        try {
            const query = `CREATE TABLE IF NOT EXISTS Schools (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      address VARCHAR(255) NOT NULL,
      latitude FLOAT NOT NULL,
      longitude FLOAT NOT NULL
  );
  `;
            const data = yield connection.execute(query);
            try {
                const query = `INSERT INTO Schools (name,  address,latitude,longitude)
              VALUES (?,?,?,?);`;
                const data = yield connection.execute(query, [
                    body.name,
                    body.address,
                    body.latitude,
                    body.longitude,
                ]);
                res.json("School added successfully");
            }
            catch (err) {
                res.json(err);
            }
        }
        catch (err) {
            res.json(err);
        }
    }
    else {
        return res.send("Wrong fomat in data");
    }
}));
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}
app.get("/listSchool", connect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = `SELECT * FROM Schools`;
    var latitude1 = Number(req.headers.latitude);
    var longitude1 = Number(req.headers.longitude);
    const lat2 = toRadians(latitude1);
    const lon2 = toRadians(longitude1);
    var data = yield connection.execute(query);
    var sorted_list = data[0].filter((item) => {
        const lat1 = toRadians(item.latitude);
        const lon1 = toRadians(item.longitude);
        var dist = Math.acos(Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)) * 6371;
        if (dist <= 100) {
            return item;
        }
        else {
            return;
        }
    });
    if (sorted_list.length != 0) {
        res.send(sorted_list);
    }
    else {
        res.send("No schools in proximity");
    }
}));
app.listen(3000);
