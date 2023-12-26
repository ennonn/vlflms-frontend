import {
  backendURL,
  showNavAdminPages,
  successNotification,
  errorNotification,
  getLoggedUser,
} from "../utils/utils.js";

let for_update_id = "";

// Get Logged User Info
getLoggedUser();

// Get Admin Pages
showNavAdminPages();

getLoggedUser();
 // Logout Btn
  const btn_logout = document.getElementById("btn_logout");
  btn_logout.onclick = async () => {
    // Access Logout API Endpoint
    const response = await fetch(backendURL + "/api/logout", {
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
        'ngrok-skip-browser-warning': 'any'
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


async function initPage() {
  await Promise.all([getAuthorsDropdown(), getGenresDropdown()]);
  
  // Add event listener to the search form
  document.getElementById("form_search").addEventListener("submit", function (event) {
    event.preventDefault();
    const keyword = document.getElementById("form_search").elements.keyword.value;
    getBooks(1, keyword);
  });

  // Initially load books with page 1 and no keyword
  getBooks(1);
}

// Show Book Form Modal
const modalShowButton = document.getElementById("modal_show");
modalShowButton.addEventListener("click", () => {
  document.getElementById("form_books").reset();
  getAuthorsDropdown();
  getGenresDropdown();
});

// Book Form Submission
const formBooks = document.getElementById("form_books");
formBooks.onsubmit = async (e) => {
  e.preventDefault();
  disableSubmitButton(true);

  // Get form data
const formData = new FormData(formBooks);
removeUserIdField(formData);

// Create a URLSearchParams object and append form data to it
const urlSearchParams = new URLSearchParams(formData);

// Send the book request using the URLSearchParams
const response = await sendBookRequest(urlSearchParams);

  if (response.ok) {
    handleSuccessfulBookSubmission();
  } else if (response.status === 422) {
    handleValidationErrors(response);
  }

  resetFormState();
};

// Delete Book Action
const deleteBook = async (id) => {
  const confirmDelete = confirm('Are you sure you want to delete this book?');
  if (!confirmDelete) {
    return;
  }

  try {
    const response = await deleteBookRequest(id);

    if (response.ok) {
      handleSuccessfulBookDeletion();
    } else {
      handleBookDeletionError();
    }
  } catch (error) {
    console.error('Error deleting book:', error);
    handleBookDeletionError();
  }
};

// Show Book Data for Editing
const editBook = async (id) => {
  for_update_id = id;
  await showBookData(id);
  document.getElementById("modal_show").click();
};

// Show Book Data for Editing
const showBookData = async (id) => {
  // Fetch book data using the book ID
  const response = await fetch(backendURL + `/api/books/${id}`, {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
      'ngrok-skip-browser-warning': 'any'
    },
  });

  if (response.ok) {
    const bookData = await response.json();

    // Populate the form fields with the fetched data
    document.getElementById("book_title").value = bookData.title;
    document.getElementById("author").value = bookData.author_id;
    document.getElementById("genre").value = bookData.genre_id;
    //document.getElementById("year_published").value = bookData.year_published;
   // document.getElementById("isbn").value = bookData.isbn;
    //document.getElementById("description").value = bookData.description;

    // You can add more fields as needed
  } else {
    errorNotification("HTTP-Error: " + response.status);
  }
};

// Updated getBooks function
async function getBooks(page = 1, keyword = "") {
  // Add Loading if pagination or search is used; Remove if not needed
  if (page !== 1 || keyword !== "") {
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
  let queryParams = new URLSearchParams();

  // Add page parameter for pagination
  if (page !== 1) {
    queryParams.append('page', page);
  }

  // Add keyword parameter for search
  if (keyword !== "") {
    queryParams.append('keyword', keyword);
  }

  // Convert URLSearchParams to string
  let queryString = queryParams.toString();
  

  // Get Books API Endpoint with pagination and search parameters
  const response = await fetch(backendURL + "/api/books" + (queryString ? `?${queryString}` : ""), {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
      'ngrok-skip-browser-warning': 'any'
    },
  });

  // Get response if 200-299 status code
  if (response.ok) {
    const responseData = await response.json();

    // Fetch authors and genres data
    const authorsResponse = await fetch(backendURL + "/api/authors", {
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
        'ngrok-skip-browser-warning': 'any'
      },
    });
    
    const genresResponse = await fetch(backendURL + "/api/genres", {
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
        'ngrok-skip-browser-warning': 'any'
      },
    });

    if (authorsResponse.ok && genresResponse.ok) {
      responseData.authors = await authorsResponse.json();
      responseData.genres = await genresResponse.json();
    } else {
      errorNotification("HTTP-Error while fetching authors or genres");
    }

    // Log books data for debugging
    console.log("Books Data:", responseData);

    // Render books on the page
    renderBooks(responseData);

    // Remove the spinner
    document.getElementById("get_data").style.display = "none";

    // Log the pagination links for debugging
    console.log("Pagination Links:", responseData.links);
  } else {
    errorNotification("HTTP-Error: " + response.status);
  }
}
// New function to render books on the page


// Function to render books on the page
async function renderBooks(responseData) {
  const booksContainer = document.getElementById("books-container");

  // Clear existing content
  booksContainer.innerHTML = "";

  if (responseData && responseData.data && responseData.data.length > 0) {
    responseData.data.forEach(async (book) => {
      // Create a card element
      const card = document.createElement("div");
      card.className = "card mb-3";


      // Populate card with book information
      const titleElement = document.createElement("h3");
      titleElement.textContent = book.title;
      card.appendChild(titleElement);

      // Populate card with author information
      const authorElement = document.createElement("p");
      const authorFullName = await getAuthorFullName(book.author_id, responseData.authors);
      authorElement.textContent = `Author: ${authorFullName || "Unknown"}`;
      card.appendChild(authorElement);

      // Populate card with genre information
      const genreElement = document.createElement("p");

      // Access the 'data' property to get the array of genres
      const genreName = getGenreName(book.genre_id, responseData.genres.data);
      genreElement.textContent = `Genre: ${genreName || "Unknown"}`;
      
      card.appendChild(genreElement);

      const yearElement = document.createElement("p");
      yearElement.textContent = `Year Published: ${book.year_published || "Unknown"}`;
      card.appendChild(yearElement);

      // Add Edit and Delete buttons
      const actionsContainer = document.createElement("div");
      actionsContainer.className = "actions";

      const editButton = document.createElement("button");
      editButton.textContent = "Edit";
      editButton.addEventListener("click", () => editBook(book.id));
      actionsContainer.appendChild(editButton);

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", () => deleteBook(book.id));
      actionsContainer.appendChild(deleteButton);

      card.appendChild(actionsContainer);

      // Append the card to the container
      booksContainer.appendChild(card);
    });

    // Display pagination links
    renderPagination(responseData.links);
  } else {
    console.log("No books found. Response Data:", responseData);

    const noBooksMessage = document.createElement("p");
    noBooksMessage.textContent = "No books available.";

    booksContainer.appendChild(noBooksMessage);
  }
}

function getAuthorFullName(authorId, authors) {
  if (authors && Array.isArray(authors)) {
    const author = authors.find((author) => author.id === authorId);
    return author ? `${author.first_name} ${author.last_name}` : "Unknown";
  }
  return "Unknown";
}

function getGenreName(genreId, genres) {
  if (genres && Array.isArray(genres)) {
    const genre = genres.find((genre) => genre.id === genreId);
    return genre ? genre.name : "Unknown";
  }
  return "Unknown";
}

// Update renderPagination function
function renderPagination(links, keyword) {
  const paginationContainer = document.getElementById("get_pagination");
  paginationContainer.innerHTML = "";

  if (links && links.length > 0) {
    links.forEach((link) => {
      const listItem = document.createElement("li");
      listItem.className = `page-item${link.active ? " active" : ""}`;

      const pageLink = document.createElement("a");
      pageLink.className = "page-link";
      pageLink.href = link.url || "#"; // Set the URL or '#' if it's a disabled link
      pageLink.innerHTML = link.label;

      // Add an event listener to the pagination link
      pageLink.addEventListener("click", (e) => {
        e.preventDefault();
        // Check if the link is not disabled
        if (!link.url) {
          // Call the pageAction function with the URL and keyword
          pageAction(link.label, keyword);
        }
      });

      listItem.appendChild(pageLink);
      paginationContainer.appendChild(listItem);
    });
  }
}
function pageAction(url) {
  const urlParams = new URLSearchParams(url);
  const page = urlParams.get('page');
  const keyword = urlParams.get('keyword');
  getBooks(page, keyword);
}


// Populate authors dropdown
async function getAuthorsDropdown() {
  const response = await fetch(backendURL + "/api/authors", {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
      'ngrok-skip-browser-warning': 'any'
    },
  });

  if (response.ok) {
    const responseData = await response.json();
    const authors = responseData.data; // Access the 'data' property

    let options = '<option value="" disabled selected>Select Author</option>';
    authors.forEach((author) => {
      options += `<option value="${author.id}">${author.first_name} ${author.last_name}</option>`;
    });

    const authorDropdown = document.getElementById("author");
    if (authorDropdown) {
      authorDropdown.innerHTML = options;
    }
  } else {
    errorNotification("HTTP-Error: " + response.status);
  }
}

// Populate genres dropdown
async function getGenresDropdown() {
  const response = await fetch(backendURL + "/api/genres", {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
      'ngrok-skip-browser-warning': 'any'
    },
  });

  if (response.ok) {
    try {
      const responseData = await response.json();

      if (Array.isArray(responseData.data)) {
        let options = '<option value="" disabled selected>Select Genre</option>';
        responseData.data.forEach((genre) => {
          options += `<option value="${genre.id}">${genre.name}</option>`;
        });

        const genreDropdown = document.getElementById("genre");
        if (genreDropdown) {
          genreDropdown.innerHTML = options;
        }
      } else {
        throw new Error("Invalid response format for genres");
      }
    } catch (error) {
      console.error("Error parsing JSON:", error);
      errorNotification("An error occurred while processing genres.", 10);
    }
  } else {
    errorNotification("HTTP-Error: " + response.status);
  }
}

// Function to disable the submit button during form submission
function disableSubmitButton(disabled) {
  const submitButton = document.querySelector("#form_books button[type='submit']");
  submitButton.disabled = disabled;
  submitButton.innerHTML = disabled
    ? `<div class="spinner-border me-2" role="status"></div><span>Loading...</span>`
    : "Submit";
}

// Function to remove the user_id field from the form data
function removeUserIdField(formData) {
  const userIdField = formBooks.querySelector('input[name="user_id"]');
  if (userIdField) {
    formData.delete('user_id');
  }
}

// Function to send a book request (POST or PUT) based on the update status
async function sendBookRequest(formData) {
  const url = for_update_id === "" ? "/api/books" : `/api/books/${for_update_id}`;
  const method = for_update_id === "" ? "POST" : "PUT";

  try {
    const response = await fetch(backendURL + url, {
      method: method,
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'any'
      },
      body: JSON.stringify(Object.fromEntries(formData)),
    });

    if (response.ok) {
      return response;
    } else {
      const errorData = await response.json(); // Try to parse error response
      throw new Error(`HTTP-Error: ${response.status} - ${errorData.message}`);
    }
  } catch (error) {
    console.error("Error sending book request:", error);
    throw error;
  }
}
// Function to handle successful book submission
function handleSuccessfulBookSubmission() {
  formBooks.reset();
  successNotification(`Successfully ${for_update_id === "" ? "created" : "updated"} book.`, 10);
  document.getElementById("modal_close").click();
  getBooks();
}

// Function to handle validation errors
async function handleValidationErrors(response) {
  try {
    const json = await response.json();
    console.error("Error Messages:", json.errors);
    document.getElementById("modal_close").click();
    errorNotification(json.message, 10);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    document.getElementById("modal_close").click();
    errorNotification("An error occurred while processing your request.", 10);
  }
}


async function deleteBookRequest(bookId) {
  const response = await fetch(backendURL + `/api/books/${bookId}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: 'Bearer ' + localStorage.getItem('token'),
      'ngrok-skip-browser-warning': 'any'
    },
  });

  return response;
}

function handleSuccessfulBookDeletion() {
  // Update UI as needed, e.g., show a success message, reload books, etc.
  successNotification('Book deleted successfully.', 10);
  getBooks(); // Reload books after deletion
}

function handleBookDeletionError() {
  // Update UI as needed, e.g., show an error message, etc.
  errorNotification('Unable to delete book.', 10);
}


// Function to reset form state after submission
function resetFormState() {
  for_update_id = "";
  disableSubmitButton(false);
}



// ... (Rest of the code remains unchanged)

// Call the initialization function
initPage();