const express = require('express');
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/authDB", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((error) => console.log(error));

// Book Schema - Book details
const bookSchema = new mongoose.Schema({
  Nameofbook: String,
  kategoria: String,
  completed: Boolean,
  // Adding reference to Permbajtja
  permbajtja: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permbajtja' }]
});

// Permbajtja Schema - Content (images, pages, etc.)
const permbajtjaelibrit = new mongoose.Schema({
  permbajtjaelibrave: String,  // Description/content of the book page or image
  imageUrl: String,  // URL of the image or photo
});

// Models
const Book = mongoose.model("Book", bookSchema);
const Permbajtja = mongoose.model("Permbajtja", permbajtjaelibrit);

// API Endpoints

// Get all books (with references to Permbajtja data)
app.get('/books', async (req, res) => {
  try {
    const books = await Book.find().populate('permbajtja'); // Populate to fetch related permbajtja data
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single book by ID (with references to Permbajtja data)
app.get('/books/:id', async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  try {
    const book = await Book.findById(id).populate('permbajtja');
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new book (with empty permbajtja initially)
app.post('/books', async (req, res) => {
  try {
    const newBook = new Book({
      Nameofbook: req.body.Name,
      kategoria: req.body.kategoria,
      completed: false,
      permbajtja: []  // No content references initially
    });
    const savedBook = await newBook.save();
    res.json(savedBook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a book
app.put('/books/:id', async (req, res) => {
  try {
    const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedBook) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.json(updatedBook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a book
app.delete('/books/:id', async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  try {
    const deletedBook = await Book.findByIdAndDelete(id);
    if (!deletedBook) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/permbajtja', async (req, res) => {
  try {
    const newContent = new Permbajtja({
      permbajtjaelibrave: req.body.permbajtjaelibrave,
      imageUrl: req.body.imageUrl
    });
    
    const savedContent = await newContent.save();

    // Add the content to the specific book's permbajtja array
    const book = await Book.findById(req.body.bookId);
    if (book) {
      book.permbajtja.push(savedContent._id); // Push the content's ObjectId
      await book.save(); // Save the updated book document
      res.json(savedContent);  // Send the saved content back as a response
    } else {
      res.status(404).json({ message: "Book not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Start server
app.listen(3000, () => console.log("Server running on port 3000"));
