const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  bookId: { type: String, unique: true, sparse: true, trim: true },
  catalogCode: { type: String, unique: true, sparse: true, trim: true },
  ISBN: { type: String, sparse: true, trim: true },
  isbn: { type: String, sparse: true, trim: true }, // backward-compatibility alias
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  publisher: { type: String, trim: true },
  edition: { type: String, trim: true },
  publicationYear: { type: Number },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  category: { type: String, default: 'General', trim: true },
  language: { type: String, default: 'English', trim: true },
  shelfLocation: { type: String, trim: true },
  totalCopies: { type: Number, default: 1, min: 0 },
  availableCopies: { type: Number, default: 1, min: 0 },
  bookStatus: { 
    type: String, 
    enum: ['Available', 'Low Stock', 'Out of Stock', 'Archived', 'Damaged', 'Lost'], 
    default: 'Available' 
  },
  description: { type: String, trim: true },
  coverImage: { type: String, trim: true },
  coverUrl: { type: String, trim: true }, // backward-compatibility alias
  sourceProvider: { type: String, default: 'Open Library', trim: true },
  providerReference: { type: String, trim: true },
  demoRecord: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// Text index for fast multi-field searching
bookSchema.index({ title: 'text', author: 'text', description: 'text', ISBN: 'text', isbn: 'text', catalogCode: 'text' });
bookSchema.index({ category: 1, availableCopies: 1 });

// Pre-save synchronization
bookSchema.pre('save', function (next) {
  if (this.ISBN && !this.isbn) this.isbn = this.ISBN;
  if (this.isbn && !this.ISBN) this.ISBN = this.isbn;
  if (this.coverImage && !this.coverUrl) this.coverUrl = this.coverImage;
  if (this.coverUrl && !this.coverImage) this.coverImage = this.coverUrl;
  
  if (this.availableCopies === 0) {
    if (this.bookStatus !== 'Damaged' && this.bookStatus !== 'Lost') {
      this.bookStatus = 'Out of Stock';
    }
  } else if (this.availableCopies <= 2) {
    if (this.bookStatus !== 'Damaged' && this.bookStatus !== 'Lost') {
      this.bookStatus = 'Low Stock';
    }
  } else {
    if (this.bookStatus !== 'Damaged' && this.bookStatus !== 'Lost') {
      this.bookStatus = 'Available';
    }
  }
  next();
});

module.exports = mongoose.model('Book', bookSchema);
