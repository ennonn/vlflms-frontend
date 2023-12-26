// genres.js
import {
  backendURL,
  showNavAdminPages,
  successNotification,
  errorNotification,
  getLoggedUser,
} from "../utils/utils.js";

// Get Logged User Info
getLoggedUser();

// Get Admin Pages
showNavAdminPages();

// Initialize page variable for pagination
let currentPage = 1;

// Initialize perPage variable for pagination
const perPage = 10;

// Initialize total variable for pagination
let total;

// Initialize pagination controls
const paginationElement = document.getElementById("get_pagination");

getLoggedUser();
// Logout Btn
const btn_logout = document.getElementById("btn_logout");
btn_logout.onclick = async () => {
  // Access Logout API Endpoint
  const response = await fetch(backendURL + "/api/logout", {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
      "ngrok-skip-browser-warning": "any",
    },
  });

  // Get response if 200-299 status code
  if (response.ok) {
    // Clear Tokens
    localStorage.clear();

    successNotification("Logout Successful.");
    // Redirect Page
    window.location.pathname = "/";
  }
  // Get response if 400 or 500 status code
  else {
    const json = await response.json();

    errorNotification(json.message, 10);
  }
};

// Declare forUpdateId variable here
let forUpdateId = "";
function createGenreCard(genre) {
  return `<div class="col-sm-12">
    <div class="card w-100 mt-3" data-id="${genre.id}">
      <div class="row">
        <div class="col-sm-8">
          <div class="card-body">
            <h5 class="card-title">${genre.name}</h5>
          </div>
        </div>
        <div class="col-sm-4">
          <div class="dropdown float-end">
            <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false"></button>
            <ul class="dropdown-menu">
              <li>
                <a class="dropdown-item" href="#" id="btn_edit" data-id="${genre.id}">Edit</a>
              </li>
              <li>
                <a class="dropdown-item" href="#" id="btn_delete" data-id="${genre.id}">Delete</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

async function getGenres(url = "", keyword = "") {
  // Add Loading if pagination or search is used; Remove if not needed
  if (url !== "" || keyword !== "") {
    document.getElementById(
      "get_data"
    ).innerHTML = `<div class="col-sm-12 d-flex justify-content-center align-items-center">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <b class="ms-2">Loading Data...</b>
      </div>`;
  }

  // To cater pagination and search feature
  let queryParams =
    "?" +
    (url !== "" ? new URL(url).searchParams + "&" : "") +
    (keyword !== "" ? "keyword=" + keyword : "");

  try {
    // Get Genres API Endpoint; Caters search
    const response = await fetch(backendURL + "/api/genres" + queryParams, {
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
        "ngrok-skip-browser-warning": "any",
      },
    });

    // Get response if 200-299 status code
    if (response.ok) {
      const responseBody = await response.text(); // Read the response body as text
      const json = JSON.parse(responseBody); // Parse the text as JSON

      // Display Genres
      let container = "";
      json.data.forEach((genre) => {
        container += createGenreCard(genre);
      });
      document.getElementById("get_data").innerHTML = container;

      // Assign click event on Edit Btns
      document.querySelectorAll("#btn_edit").forEach((element) => {
        element.addEventListener("click", editAction);
      });

      // Assign click event on Delete Btns
      document.querySelectorAll("#btn_delete").forEach((element) => {
        element.addEventListener("click", deleteAction);
      });

      // Update pagination controls only if a keyword is present
      if (keyword !== "") {
        updatePagination(json, keyword);
      }
    }
    // Get response if 400+ or 500+ status code
    else {
      console.error("HTTP-Error: " + response.status);
      console.log("Response Headers:", response.headers);
      console.log("Response Body:", await response.text());
      errorNotification("HTTP-Error: " + response.status);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    errorNotification("Error fetching data");
  }
}

/* async function getGenres(url = "", keyword = "") {
  // Add Loading if pagination or search is used; Remove if not needed
  if (url !== "" || keyword !== "") {
    document.getElementById("get_data").innerHTML = `<div class="col-sm-12 d-flex justify-content-center align-items-center">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <b class="ms-2">Loading Data...</b>
      </div>`;
  }

  // To cater pagination and search feature
  let queryParams =
    "?" +
    (url !== "" ? new URL(url).searchParams + "&" : "") +
    (keyword !== "" ? "keyword=" + keyword : "");

  try {
    // Get Genres API Endpoint; Caters search and pagination
    const response = await fetch(backendURL + "/api/genres" + queryParams, {
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });

    // Check if the response status is not OK
    if (!response.ok) {
      throw new Error("HTTP-Error: " + response.status);
    }

    // Check if the content type is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Invalid content type: " + contentType);
    }

    // Parse JSON data
    const json = await response.json();

    // Display Genres
    let container = "";
    json.data.forEach((genre) => {
      container += createGenreCard(genre);
    });
    document.getElementById("get_data").innerHTML = container;

    // Assign click event on Edit Btns
    document.querySelectorAll("#btn_edit").forEach((element) => {
      element.addEventListener("click", editAction);
    });

    // Assign click event on Delete Btns
    document.querySelectorAll("#btn_delete").forEach((element) => {
      element.addEventListener("click", deleteAction);
    });

    // Update pagination controls only if a keyword is present
    if (keyword !== "") {
      updatePaginationGenres(json, keyword);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    errorNotification("Error fetching data");
  }
  
} */
function pageAction(e) {
  e.preventDefault();
  const url = e.target.getAttribute("href");
  getGenres(url);
}

// ... (your existing code)

// Update your event listener for pagination links
paginationElement.addEventListener("click", function (e) {
  e.preventDefault();
  const target = e.target;

  if (target.tagName === "A" && !target.classList.contains("active")) {
    const url = target.getAttribute("href");
    getGenres(url);
  }
});

// Function to update pagination controls
// Function to update pagination controls
function updatePagination(data, keyword = "") {
  paginationElement.innerHTML = ""; // Clear previous pagination

  // Add Previous page control
  if (data.prev_page_url) {
    addPaginationLink(data.prev_page_url, "Previous");
  }

  // Add page controls
  for (let i = 1; i <= data.last_page; i++) {
    addPaginationLink(
      backendURL +
        "/api/genres?page=" +
        i +
        (keyword ? "&keyword=" + keyword : ""),
      i.toString(),
      i === data.current_page
    );
  }

  // Add Next page control
  if (data.next_page_url) {
    addPaginationLink(
      backendURL +
        "/api/genres?page=" +
        (data.current_page + 1) +
        (keyword ? "&keyword=" + keyword : ""),
      "Next"
    );
  }
}
// ... (rest of your code)

// Function to add a pagination link
function addPaginationLink(url, label, isActive = false) {
  const listItem = document.createElement("li");
  const linkElement = document.createElement("a");

  linkElement.href = url;
  linkElement.textContent = label;

  if (isActive) {
    listItem.classList.add("active");
  }

  linkElement.addEventListener("click", pageAction); // Add this line

  listItem.appendChild(linkElement);
  document.getElementById("get_pagination").appendChild(listItem);
}

// ... rest of your code ...

const deleteAction = async (e) => {
  const id = e.target.getAttribute("data-id");

  const confirmDelete = confirm("Are you sure you want to delete this genre?");
  if (!confirmDelete) {
    return;
  }

  const response = await fetch(backendURL + "/api/genres/" + id, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
      "ngrok-skip-browser-warning": "any",
    },
  });

  if (response.ok) {
    successNotification("Genre deleted successfully.", 10);
    getGenres(); // Reload Genres after deletion
  } else {
    errorNotification("Unable to delete genre!", 10);
  }
};

// ... rest of your code ...

const editAction = async (e) => {
  const id = e.target.getAttribute("data-id");
  forUpdateId = id; // Set the global variable forUpdateId

  // Open the modal before fetching and displaying genre data
  document.getElementById("modal_show").click();

  // Show Genre Data
  await showGenreData(id);
};

const form_search = document.getElementById("form_search");

form_search.onsubmit = async (e) => {
  e.preventDefault();

  const formData = new FormData(form_search);
  const keyword = formData.get("keyword");

  // Reload Genres with the search keyword
  getGenres("", keyword);
};

// Show Genre Data
const showGenreData = async (id) => {
  document.querySelector(`.card[data-id="${id}"]`).style.backgroundColor =
    "yellow";

  const response = await fetch(backendURL + "/api/genres/" + id, {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
      "ngrok-skip-browser-warning": "any",
    },
  });

  if (response.ok) {
    const genre = await response.json();

    // Populate your form fields with genre data for updating
    document.getElementById("genre_name").value = genre.name;

    // Update the hidden input for genre_id
    document.getElementById("genre_id").value = id;
  } else {
    errorNotification("Unable to show genre!", 10);
    document.querySelector(`.card[data-id="${id}"]`).style.backgroundColor =
      "white";
  }
};

const form_genre = document.getElementById("form_genre");

form_genre.onsubmit = async (e) => {
  e.preventDefault();

  // Disable Button
  document.querySelector("#form_genre button[type='submit']").disabled = true;
  document.querySelector(
    "#form_genre button[type='submit']"
  ).innerHTML = `<div class="spinner-border me-2" role="status"></div>
                        <span>Loading...</span>`;

  const headers = {
    Accept: "application/json",
    Authorization: "Bearer " + localStorage.getItem("token"),
    "Content-Type": "application/json",
  };

  // Get Values of Form (input, textarea, select) set it as form-data
  const formData = new FormData(form_genre);
  const genreName = formData.get("genre_name"); // Get genre name from form data

  const requestBody = {
    name: genreName,
  };

  let response;

  // Check if forUpdateId is empty, if empty, then it's create, else it's update
  if (forUpdateId === "") {
    // Fetch API Genres Store Endpoint
    response = await fetch(backendURL + "/api/genres", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
      "ngrok-skip-browser-warning": "any",
    });
  }
  // for Update
  else {
    // Fetch API Genres Update Endpoint
    response = await fetch(backendURL + "/api/genres/" + forUpdateId, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(requestBody),
      "ngrok-skip-browser-warning": "any",
    });
  }

  // Get response if 200-299 status code
  if (response.ok) {
    // Reset Form
    form_genre.reset();

    successNotification(
      "Successfully " +
        (forUpdateId === "" ? "created" : "updated") +
        " genre.",
      10
    );

    // Close Modal Form
    document.getElementById("modal_close").click();

    // Reload Genres
    getGenres();
  }
  // Get response if 422 status code
  else if (response.status === 422) {
    try {
      const json = await response.json();
      // Log the error messages
      console.error("Error Messages:", json.errors);
      // Display error notification or handle errors as needed
    } catch (error) {
      console.error("Error parsing JSON:", error);
      // Display a generic error notification
      // Handle errors as needed
    }
  }

  // Always reset forUpdateId to an empty string
  forUpdateId = "";

  document.querySelector("#form_genre button[type='submit']").disabled = false;
  document.querySelector("#form_genre button[type='submit']").innerHTML =
    "Submit";
};

// Update your event listener for pagination links
document
  .getElementById("get_pagination")
  .addEventListener("click", function (e) {
    e.preventDefault();
    if (e.target.tagName === "A" && !e.target.classList.contains("active")) {
      currentPage = parseInt(e.target.textContent);
      getGenres(backendURL + "/api/genres?page=" + currentPage);
    }
  });

// Initialize by getting the genres automatically when the page loads
getGenres();
