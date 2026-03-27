import axios from "axios";

const API = axios.create({
  baseURL: "https://rfq-british-auction-system.onrender.com"
});

export default API;
