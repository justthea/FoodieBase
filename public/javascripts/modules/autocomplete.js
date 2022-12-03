// below the order of lat and lng is how googleMap did it
function autocomplete(input, latInput, lngInput) {
  //   console.log(input, latInput, lngInput);
  if (!input) return; //skip this func from running if there is no input on the page
  const dropdown = new google.maps.places.Autocomplete(input);

  dropdown.addListener("place_changed", () => {
    const place = dropdown.getPlace();
    latInput.value = place.geometry.location.lat();
    lngInput.value = place.geometry.location.lng();
  });
  //if someone hits enter on the address field, dont submit the form
  input.on("keydown", (e) => {
    if (e.keycode === 13) e.preventDefault();
  });
}

export default autocomplete;
