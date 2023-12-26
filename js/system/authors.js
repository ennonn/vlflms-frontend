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
  let currentPageAuthors = 1;  // Rename to avoid conflicts
  
  // Initialize perPage variable for pagination
  const perPage = 10;
  
  // Initialize total variable for pagination
  let total;
  
  // Initialize pagination controls for authors
  const paginationElementAuthors = document.getElementById("get_pagination");  // Adjust the ID
  
  // Declare forUpdateId variable here
  let forUpdateId = "";
  
  // Move addPaginationLink function here
  function addPaginationLink(href, text, isActive = false) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = href;
    a.textContent = text;
    if (isActive) {
      a.classList.add("active");
    }
    li.appendChild(a);
    paginationElementAuthors.appendChild(li);
  }
  
  const form_author = document.getElementById("form_author");
  
  form_author.onsubmit = async (e) => {
    e.preventDefault();
  
    // Disable Button
    document.querySelector("#form_author button[type='submit']").disabled = true;
    document.querySelector(
      "#form_author button[type='submit']"
    ).innerHTML = `<div class="spinner-border me-2" role="status"></div>
                          <span>Loading...</span>`;
  
    // Get Values of Form (input, textarea, select) set it as form-data
    const formData = new FormData(form_author);
  
    // Remove 'user_id' from FormData (if it's present)
    if (form_author.querySelector('input[name="user_id"]')) {
      formData.delete('user_id');
    }
  
    console.log("FormData:", [...formData.entries()]);  // Log FormData before making the fetch request
  
    let response;
  
    // Check if for_update_id is empty, if empty, then it's create, else it's update
    if (forUpdateId === "") {
      // Fetch API Authors Store Endpoint
      response = await fetch(backendURL + "/api/authors", {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
          'Content-Type': 'application/x-www-form-urlencoded',
          'ngrok-skip-browser-warning': 'any'
        },
        body: new URLSearchParams(formData).toString(),
      });
    }
    // for Update
    else {
      // Fetch API Authors Update Endpoint
      response = await fetch(backendURL + "/api/authors/" + forUpdateId, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
          'Content-Type': 'application/x-www-form-urlencoded',
          'ngrok-skip-browser-warning': 'any'
        },
        body: new URLSearchParams(formData).toString(),
      });
    }
  
    console.log("Response:", response);  // Log the response to check for any error messages
  
    // Get response if 200-299 status code
    if (response.ok) {
      // Reset Form
      form_author.reset();
  
      successNotification(
        "Successfully " +
          (forUpdateId === "" ? "created" : "updated") +
          " author.",
        10
      );
  
      // Close Modal Form
      document.getElementById("modal_close").click();
  
      // Reload Authors
      getAuthors();
    }
    // Get response if 422 status code
    else if (response.status === 422) {
      try {
        const json = await response.json();
        // Log the error messages
        console.error("Error Messages:", json.errors);
        // Close Modal Form
        document.getElementById("modal_close").click();
        // Display error notification
        errorNotification(json.message, 10);
      } catch (error) {
        console.error("Error parsing JSON:", error);
        // Close Modal Form
        document.getElementById("modal_close").click();
        // Display a generic error notification
        errorNotification("An error occurred while processing your request.", 10);
      }
    }
  
    // Always reset forUpdateId to an empty string
    forUpdateId = "";
  
    document.querySelector("#form_author button[type='submit']").disabled = false;
    document.querySelector("#form_author button[type='submit']").innerHTML =
      "Submit";
  };
  
  // Get All Authors
  getAuthors();
  
  function createAuthorCard(author) {
    return `<div class="col-sm-12">
      <div class="card w-100 mt-3" data-id="${author.id}">
        <div class="row">
          <div class="col-sm-8">
            <div class="card-body">
              <h5 class="card-title">${author.first_name} ${author.last_name}</h5>
              <p class="card-text">User ID: ${author.user_id}</p>
            </div>
          </div>
          <div class="col-sm-4">
            <div class="dropdown float-end">
              <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false"></button>
              <ul class="dropdown-menu">
                <li>
                  <a class="dropdown-item" href="#" id="btn_edit" data-id="${author.id}">Edit</a>
                </li>
                <li>
                  <a class="dropdown-item" href="#" id="btn_delete" data-id="${author.id}">Delete</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }
  
  async function getAuthors(url = "", keyword = "") {
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
      // Get Authors API Endpoint; Caters search and pagination
      const response = await fetch(backendURL + "/api/authors" + queryParams, {
        headers: {
          Accept: "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
          'ngrok-skip-browser-warning': 'any'
        },
      });
  
      // Get response if 200-299 status code
      if (response.ok) {
        const json = await response.json();
        // Display Authors
        let container = "";
        json.data.forEach((author) => {
          container += createAuthorCard(author);
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
          updatePaginationAuthors(json, keyword);
        }
      }
      // Get response if 400+ or 500+ status code
      else {
        errorNotification("HTTP-Error: " + response.status);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      errorNotification("Error fetching data");
    }
  }
  
  function pageActionAuthors(e) {
    e.preventDefault();
    const url = e.target.getAttribute("href");
    getAuthors(url);
  }
  
  // ... (other functions remain the same)
  
  if (paginationElementAuthors) {
    paginationElementAuthors.addEventListener("click", function (e) {
      e.preventDefault();
      const target = e.target;
  
      if (target.tagName === "A" && !target.classList.contains("active")) {
        const url = target.getAttribute("href");
        getAuthors(url);
      }
    });
  }
  
  function updatePaginationAuthors(data, keyword = "") {
    paginationElementAuthors.innerHTML = ""; // Clear previous pagination
  
    // Add Previous page control
    if (data.prev_page_url) {
      addPaginationLink(data.prev_page_url, "Previous");
    }
  
    // Add page controls
    for (let i = 1; i <= data.last_page; i++) {
      addPaginationLink(
        backendURL + "/api/authors?page=" + i + (keyword ? "&keyword=" + keyword : ""),
        i.toString(),
        i === data.current_page
      );
    }
  
    // Add Next page control
    if (data.next_page_url) {
      addPaginationLink(
        backendURL + "/api/authors?page=" + (data.current_page + 1) + (keyword ? "&keyword=" + keyword : ""),
        "Next"
      );
    }
  }
  // ... (other functions remain the same)
  
  // Initialize by getting the authors automatically when the page loads
  getAuthors();
  
  const deleteAction = async (e) => {
    const id = e.target.getAttribute("data-id");
  
    const confirmDelete = confirm("Are you sure you want to delete this author?");
    if (!confirmDelete) {
      return;
    }
  
    const response = await fetch(backendURL + "/api/authors/" + id, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
        'ngrok-skip-browser-warning': 'any'
      },
    });
  
    if (response.ok) {
      successNotification("Author deleted successfully.", 10);
      getAuthors(); // Reload Authors after deletion
    } else {
      errorNotification("Unable to delete author!", 10);
    }
  };
  
  // ... (other functions remain the same)
  
  const editAction = async (e) => {
    const id = e.target.getAttribute("data-id");
    forUpdateId = id; // Set the global variable forUpdateId
  
    // Show Author Data
    await showAuthorData(id);
  
    // Open the modal after fetching and displaying author data
    document.getElementById("modal_show").click();
  };
  
  // ... (other functions remain the same)
  
  const form_search = document.getElementById("form_search");
  
  form_search.onsubmit = async (e) => {
    e.preventDefault();
  
    const formData = new FormData(form_search);
    const keyword = formData.get("keyword");
  
    // Reload Authors with the search keyword
    getAuthors("", keyword);
  };
  
  // ... (other functions remain the same)
  
  const showAuthorData = async (id) => {
    document.querySelector(`.card[data-id="${id}"]`).style.backgroundColor = "yellow";
  
    const response = await fetch(backendURL + "/api/authors/" + id, {
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
        'ngrok-skip-browser-warning': 'any'
      },
    });
  
    if (response.ok) {
      const author = await response.json();
  
      // Populate your form fields with author data for updating
      document.getElementById("first_name").value = author.first_name;
      document.getElementById("last_name").value = author.last_name;
  
      // Add other fields as needed
    } else {
      errorNotification("Unable to show author!", 10);
      document.querySelector(`.card[data-id="${id}"]`).style.backgroundColor = "white";
    }
  };
  
  
  