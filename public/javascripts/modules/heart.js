import axios from "axios";
import { $ } from "./bling";

function ajaxHeart(e) {
  //stop the form from submitting, make post happening in js not broswer
  e.preventDefault();
  console.log("hearted");
  axios
    .post(this.action) //action is the url we wanna hit
    .then((res) => {
      //make heart 实时
      const isHearted = this.heart.classList.toggle("heart__button--hearted"); //in button heart'name in storeCard
      $(".heart-count").textContent = res.data.hearts.length;
      if (isHearted) {
        this.heart.classList.add("heart__button--float");
        //need to remove it so we wont click random wrong el
        setTimeout(
          () => this.heart.classList.remove("heart__button--float"),
          2500
        );
      }
    })
    .catch(console.error);
}

export default ajaxHeart;
