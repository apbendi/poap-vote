import Vue from 'vue';
import axios from 'axios';

let baseURL;

if (process.env.NODE_ENV === 'development') {
  baseURL = 'https://poap.vote';
  // baseURL = 'http://localhost:3000';
} else if (process.env.NODE_ENV === 'staging') {
  baseURL = 'https://staging.poap.vote';
} else if (process.env.NODE_ENV === 'production') {
  baseURL = 'https://poap.vote';
} else {
  throw new Error('Invalid build environment');
}
// Create our own axios instance and set a custom base URL. This lets
// lets easily access this instance by importing serverApi in other files
const serverApi = axios.create({
  baseURL,
});
export { serverApi };

// Access within vue files via this.$serverApi
Vue.prototype.$serverApi = serverApi;
