import { createRouter, createWebHistory } from "vue-router";

import PDFpreview from "../pages/PDFpreview.vue";


const routes = [
  {
    path: "/",
    name: "Home",
    component: PDFpreview,
  },
];


const router = createRouter({
  mode: 'history',
  history: createWebHistory(),
  //historyApiFallback: true,
  routes,
  linkActiveClass: "navActive",
  linkExactActiveClass: "navActive",

});

export default router;
