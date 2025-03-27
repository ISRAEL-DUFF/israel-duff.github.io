// Function to randomly select 10 words
export function getRandomWords(list, count = 10) {
    // Shuffle the array using Fisher-Yates algorithm
    let shuffled = list.slice().sort(() => Math.random() - 0.5);
    
    // Select the first 'count' words
    return shuffled.slice(0, count);
}

export function generateSelectFromJson(jsonData) {
    // Create the select element
   // const select = document.createElement("select");
      const select = document.getElementById('text-groups');
  
    // Loop through the JSON data and create an option for each item
    jsonData.forEach(item => {
      const option = document.createElement("option");
      option.value = item;
      option.textContent = item
      select.appendChild(option);
    });
  
    // Add event listener for selection change
    select.addEventListener('change', (event) => {
      // Set the global variable to the value of the selected option
      selectedValue = event.target.value;
  
      resetGame();
      let selectedWords = getRandomWords(dataFile[selectedValue]);
      words = selectedWords;
      generateMatchingGame();
      console.log("Selected Word List: " + selectedValue);
    });
  
    // Append the select element to the body or any other container
  //   document.body.appendChild(select);
  }