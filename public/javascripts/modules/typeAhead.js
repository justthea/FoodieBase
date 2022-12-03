//axios is like fetch built in the brower
//using webpack to convert reqire
// const axios = require("axios");
import axios from "axios";
import dompurify from "dompurify";

function searchResultsHTML(stores) {
  return stores
    .map((store) => {
      return `
        <a href='/store/${store.slug}' class='search__result'>
          <strong>${store.name}</strong>
        </a>`;
    })
    .join("");
}

//when someone type into the search box, we will git our api endpoint for the vaule and wait for the result to come back and we can ake some drop down
function typeAhead(search) {
  //if search box is not on the page, we dont wanna run the func
  if (!search) return;

  const searchInput = search.querySelector("input[name='search']");
  const searchResults = search.querySelector(".search__results");

  //listen for an input event on the search
  //on = addEventListener
  searchInput.on("input", function () {
    //if there is no input value, quit it
    if (!this.value) {
      searchResults.style.display = "none"; //hide it
      return;
    }
    //show the search results
    searchResults.style.display = "block";
    //to chnage searching content when we backspace(deleting)
    // searchResults.innerHTML = "";

    axios
      .get(`/api/search?q=${this.value}`)
      .then((res) => {
        if (res.data.length) {
          //when res.data array has result
          console.log("there is something to show");
          const html = searchResultsHTML(res.data);
          //santize the innerHTML so it wont get hacked by the search result
          searchResults.innerHTML = dompurify.sanitize(html);
          return;
        }
        //tell them nothing came back
        searchResults.innerHTML = dompurify.sanitize(
          `<div class='search__result'>No results for ${this.value} found!</div>`
        );
      })
      .catch((err) => {
        console.error(err); //send err to yourself
      });
  });
  //handle keyboard inputs
  searchInput.on("keyup", (e) => {
    // console.log(e.KeyCode);
    //if they are not pressing up, down or enter, who cares
    if (![38, 40, 13].includes(e.keyCode)) {
      return;
    }
    //need an active class to make each class as active(what r we currently on)
    const activeClass = "search__result--active";
    //eveytime we press down will find the current one (which one has curr class)
    const current = search.querySelector(`.${activeClass}`);
    const items = search.querySelectorAll(".search__result");
    let next;
    if (e.keyCode === 40 && current) {
      next = current.nextElementSibling || items[0];
    } else if (e.keyCode === 40) {
      next = items[0];
    } else if (e.keyCode === 38 && current) {
      next = current.previousElementSibling || items[items.length - 1];
    } else if (e.keyCode === 38) {
      next = items[items.length - 1];
    } else if (e.keyCode === 13 && current.href) {
      //meaning if there is a curr el with href val on it
      window.location = current.href;
      return;
    }
    if (current) {
      current.classList.remove(activeClass);
    }
    next.classList.add(activeClass);
  });
}

export default typeAhead;
