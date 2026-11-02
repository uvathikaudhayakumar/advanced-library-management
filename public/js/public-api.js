/**
 * Public APIs Service for Advanced Library Management System
 * Integrates with:
 * 1. Open Library Search & Covers API (https://openlibrary.org)
 * 2. Google Books API (https://www.googleapis.com/books/v1)
 * 
 * Provides live search, metadata normalization, and automatic fallback.
 */

const PublicAPIService = (() => {
  const OPEN_LIBRARY_SEARCH_URL = 'https://openlibrary.org/search.json';
  const GOOGLE_BOOKS_URL = 'https://www.googleapis.com/books/v1/volumes';

  // Curated fallback book catalog with high-quality Open Library & Unsplash covers
  const CURATED_SEED_BOOKS = [
    {
      id: 'book_curated_1',
      title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      author: 'Robert C. Martin',
      isbn: '9780132350884',
      category: 'Software Engineering',
      coverUrl: 'https://covers.openlibrary.org/b/isbn/9780132350884-M.jpg',
      totalCopies: 5,
      availableCopies: 3,
      publishedYear: 2008,
      rating: 4.8,
      description: 'Even bad code can function. But if code is not clean, it can bring a development organization to its knees. Every year, countless hours and significant resources are lost because of poorly written code.'
    },
    {
      id: 'book_curated_2',
      title: 'Introduction to Algorithms (CLRS)',
      author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
      isbn: '9780262033848',
      category: 'Computer Science',
      coverUrl: 'https://covers.openlibrary.org/b/isbn/9780262033848-M.jpg',
      totalCopies: 6,
      availableCopies: 2,
      publishedYear: 2009,
      rating: 4.9,
      description: 'A comprehensive textbook and reference covering a broad range of algorithms in depth, yet making their design and analysis accessible to all levels of readers.'
    },
    {
      id: 'book_curated_3',
      title: 'Artificial Intelligence: A Modern Approach',
      author: 'Stuart Russell, Peter Norvig',
      isbn: '9780136042594',
      category: 'Artificial Intelligence',
      coverUrl: 'https://covers.openlibrary.org/b/isbn/9780136042594-M.jpg',
      totalCopies: 4,
      availableCopies: 1,
      publishedYear: 2020,
      rating: 4.9,
      description: 'The leading textbook in Artificial Intelligence used in over 1,500 universities worldwide, exploring intelligent agents, neural networks, reinforcement learning, and ethics.'
    },
    {
      id: 'book_curated_4',
      title: 'Database System Concepts',
      author: 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan',
      isbn: '9780073523323',
      category: 'Database Systems',
      coverUrl: 'https://covers.openlibrary.org/b/isbn/9780073523323-M.jpg',
      totalCopies: 5,
      availableCopies: 4,
      publishedYear: 2019,
      rating: 4.7,
      description: 'Presents the fundamental concepts of database management in an intuitive manner geared toward allowing students to begin working with databases as quickly as possible.'
    },
    {
      id: 'book_curated_5',
      title: 'Computer Networking: A Top-Down Approach',
      author: 'James F. Kurose, Keith W. Ross',
      isbn: '9780133594140',
      category: 'Networking',
      coverUrl: 'https://covers.openlibrary.org/b/isbn/9780133594140-M.jpg',
      totalCopies: 4,
      availableCopies: 3,
      publishedYear: 2021,
      rating: 4.8,
      description: 'Focuses on the Internet and the fundamentally important issues of networking, providing an excellent foundation for students in computer science and electrical engineering.'
    },
    {
      id: 'book_curated_6',
      title: 'Operating System Concepts',
      author: 'Abraham Silberschatz, Peter B. Galvin, Greg Gagne',
      isbn: '9781119800361',
      category: 'Computer Science',
      coverUrl: 'https://covers.openlibrary.org/b/isbn/9781119800361-M.jpg',
      totalCopies: 4,
      availableCopies: 2,
      publishedYear: 2018,
      rating: 4.7,
      description: 'The definitive guide to operating system principles, covering virtualization, kernel architecture, memory management, file systems, and distributed security.'
    },
    {
      id: 'book_curated_7',
      title: 'Designing Data-Intensive Applications',
      author: 'Martin Kleppmann',
      isbn: '9781449373320',
      category: 'Cloud Computing',
      coverUrl: 'https://covers.openlibrary.org/b/isbn/9781449373320-M.jpg',
      totalCopies: 5,
      availableCopies: 0,
      publishedYear: 2017,
      rating: 5.0,
      description: 'The big ideas behind reliable, scalable, and maintainable systems. Key concepts behind distributed databases, stream processing, batch computing, and consensus.'
    },
    {
      id: 'book_curated_8',
      title: 'You Don\'t Know JS Yet: Get Started',
      author: 'Kyle Simpson',
      isbn: '9798602477429',
      category: 'Web Development',
      coverUrl: 'https://covers.openlibrary.org/b/isbn/9798602477429-M.jpg',
      totalCopies: 3,
      availableCopies: 3,
      publishedYear: 2020,
      rating: 4.6,
      description: 'Deep dive into the core mechanisms of the JavaScript language, exploring closures, lexical scope, asynchronous programming, prototypes, and ES6+ features.'
    }
  ];

  /**
   * Search books from Open Library Public API
   */
  async function searchOpenLibrary(query, limit = 15) {
    const encoded = encodeURIComponent(query.trim());
    const url = `${OPEN_LIBRARY_SEARCH_URL}?q=${encoded}&limit=${limit}`;
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`Open Library API responded with status ${response.status}`);
    const data = await response.json();
    
    return (data.docs || []).map(doc => {
      const isbn = doc.isbn ? doc.isbn[0] : null;
      let coverUrl = null;
      if (doc.cover_i) {
        coverUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
      } else if (isbn) {
        coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
      } else {
        coverUrl = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80';
      }

      const authors = doc.author_name ? doc.author_name.join(', ') : 'Unknown Author';
      const subject = (doc.subject && doc.subject.length) ? doc.subject[0] : 'General';
      const cleanSubject = String(subject).replace(/[^\w\s]/gi, '').slice(0, 30);

      return {
        id: 'ol_' + (doc.cover_i || doc.key?.replace('/works/', '') || Math.random().toString(36).substring(2, 9)),
        title: doc.title,
        author: authors,
        isbn: isbn || '—',
        category: cleanSubject || 'Computer Science',
        coverUrl,
        publishedYear: doc.first_publish_year || doc.publish_year?.[0] || 'N/A',
        rating: (doc.ratings_average ? Number(doc.ratings_average).toFixed(1) : (4.0 + Math.random() * 0.9).toFixed(1)),
        description: doc.first_sentence ? (Array.isArray(doc.first_sentence) ? doc.first_sentence[0] : doc.first_sentence) : `A highly regarded academic work on ${doc.title} authored by ${authors}.`,
        source: 'Open Library Public API'
      };
    });
  }

  /**
   * Search Google Books Public API as complementary / alternative source
   */
  async function searchGoogleBooks(query, limit = 15) {
    const encoded = encodeURIComponent(query.trim());
    const url = `${GOOGLE_BOOKS_URL}?q=${encoded}&maxResults=${limit}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Google Books API responded with status ${response.status}`);
    const data = await response.json();

    return (data.items || []).map(item => {
      const vi = item.volumeInfo || {};
      const isbnIdentifier = vi.industryIdentifiers?.find(id => id.type === 'ISBN_13' || id.type === 'ISBN_10');
      const isbn = isbnIdentifier ? isbnIdentifier.identifier : null;
      let cover = vi.imageLinks?.thumbnail || vi.imageLinks?.smallThumbnail;
      if (cover && cover.startsWith('http:')) cover = cover.replace('http:', 'https:');
      if (!cover && isbn) cover = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
      if (!cover) cover = 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=400&q=80';

      return {
        id: 'gb_' + item.id,
        title: vi.title || 'Untitled Book',
        author: vi.authors ? vi.authors.join(', ') : 'Unknown Author',
        isbn: isbn || '—',
        category: vi.categories ? vi.categories[0] : 'General',
        coverUrl: cover,
        publishedYear: vi.publishedDate ? vi.publishedDate.substring(0, 4) : 'N/A',
        rating: vi.averageRating ? Number(vi.averageRating).toFixed(1) : '4.5',
        description: vi.description || `Curated library volume: ${vi.title}.`,
        source: 'Google Books API'
      };
    });
  }

  /**
   * Universal Search: Queries Open Library, falls back to Google Books, or filters curated catalogue
   */
  async function search(query, limit = 15) {
    if (!query || !query.trim()) {
      return getCuratedBooks();
    }
    const cleanQuery = query.trim().toLowerCase();

    // 1. Try Open Library
    try {
      const results = await searchOpenLibrary(cleanQuery, limit);
      if (results && results.length > 0) return results;
    } catch (olErr) {
      console.warn('Open Library API query failed, trying Google Books fallback:', olErr.message);
    }

    // 2. Try Google Books fallback
    try {
      const gbResults = await searchGoogleBooks(cleanQuery, limit);
      if (gbResults && gbResults.length > 0) return gbResults;
    } catch (gbErr) {
      console.warn('Google Books API query failed:', gbErr.message);
    }

    // 3. Filter internal curated collection as resilient fallback
    return CURATED_SEED_BOOKS.filter(b => 
      b.title.toLowerCase().includes(cleanQuery) ||
      b.author.toLowerCase().includes(cleanQuery) ||
      b.category.toLowerCase().includes(cleanQuery) ||
      b.isbn.includes(cleanQuery)
    );
  }

  function getCuratedBooks() {
    return JSON.parse(JSON.stringify(CURATED_SEED_BOOKS));
  }

  return {
    search,
    searchOpenLibrary,
    searchGoogleBooks,
    getCuratedBooks
  };
})();
