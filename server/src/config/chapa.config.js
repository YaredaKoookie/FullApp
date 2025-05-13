import {Chapa} from "chapa-nodejs";
import env from "./env.config";

const chapa = new Chapa({
    secretKey: env.CHAPA_SECRET_KEY,
})

export default chapa;