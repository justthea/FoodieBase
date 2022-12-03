//entry point for all of our js, where webpack is bundling them together
import "../sass/style.scss";

import { $, $$ } from "./modules/bling";
import autocomplete from "./modules/autocomplete";
import typeAhead from "./modules/typeAhead";
import makeMap from "./modules/map";
import ajaxHeart from "./modules/heart";

//$ is document.querySelector
autocomplete($("#address"), $("#lat"), $("#lng"));

typeAhead($(".search"));

makeMap($("#map")); //use it and give it an id of map

const heartForms = $$("form.heart");
heartForms.on("submit", ajaxHeart);
