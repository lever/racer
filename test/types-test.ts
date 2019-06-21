import expect = require('expect.js');
import racer = require('../lib');
import { Model, RootModel, CollectionData } from '../lib';

interface Book {
  id: string;
  author?: Author;
  pages: Page[];
  publishedAt?: number;
}

interface Author {
  id: string;
  name: string;
}

// Make sure both interfaces and types work as Model generic types.
// tslint:disable-next-line: interface-over-type-literal
type Page = {
  text: string;
};

// Use TypeScript module augmentation on the root model's ModelData to add
// information on each collection's document types.
//
// In actual usages of Racer, this would be `declare module 'racer'` instead of
// `declare module '../lib'`:
//
//   import racer = require('racer');
//   declare module 'racer' { ... }
//
declare module '../lib' {
  interface ModelData {
    books: racer.CollectionData<Book>;
  }
}

describe('TypeScript Model', () => {
  let backend: racer.RacerBackend;
  let rootModel: RootModel;
  beforeEach(() => {
    backend = racer.createBackend({
      disableDocAction: true,
      disableSpaceDelimitedActions: true,
    });
    rootModel = backend.createModel();
  });

  //
  // Getters
  //

  describe('get', () => {
    let book1: Book;
    let book1Id: string;
    beforeEach(() => {
      book1 = {
        id: 'my-book',
        author: { id: 'alex-uuid', name: 'Alex' },
        pages: [],
        publishedAt: 1234,
      };
      book1Id = rootModel.add('books', book1);
    });

    describe('with root model', () => {
      it('can return a whole document', () => {
        const book = rootModel.get<Book>(`books.${book1Id}`);
        expect(book).to.eql(book1);
      });

      it('can return a document field', () => {
        const author = rootModel.get<Author>(`books.${book1Id}.author`);
        expect(author).to.eql(book1.author);
      });

      it('can return a document subfield', () => {
        const authorName = rootModel.get<string>(
          `books.${book1Id}.author.name`
        );
        expect(authorName).to.eql('Alex');
      });

      it('returns undefined for a non-existent value', () => {
        const nonExistentBook = rootModel.get<unknown>('books.non-existent');
        expect(nonExistentBook).to.be(undefined);
      });

      it('returns values by reference', () => {
        // Model#get returns values by reference, so for an object value, a
        // later change to a property via model methods should be reflected in the
        // previously returned object.
        const book = rootModel.get<Book>(`books.${book1Id}`);
        expect(book).to.have.property('publishedAt', 1234);
        rootModel.set(`books.${book1Id}.publishedAt`, 5678);
        expect(book).to.have.property('publishedAt', 5678);
      });
    });

    describe('with child model', () => {
      let bookModel: Model<Book>;
      beforeEach(() => {
        bookModel = rootModel.at<Book>(`books.${book1Id}`);
      });

      it('can return a whole document', () => {
        const book = bookModel.get();
        expect(book).to.eql(book1);
      });

      it('can return a document field', () => {
        const author = bookModel.get<Author>('author');
        expect(author).to.eql(book1.author);
      });

      it('can return a document subfield', () => {
        const authorName = bookModel.get<string>('author.name');
        expect(authorName).to.eql('Alex');
      });

      it('returns undefined for a non-existent value', () => {
        const nonExistent = bookModel.get<unknown>('pages.12');
        expect(nonExistent).to.be(undefined);
      });
    });
  });

  //
  // Mutators
  //

  describe('increment', () => {
    let book1: Book;
    let book1Id: string;
    let book1Model: Model<Book>;
    beforeEach(() => {
      book1 = {
        id: 'my-book',
        pages: [],
        publishedAt: 100,
      };
      book1Id = rootModel.add('books', book1);
      book1Model = rootModel.at<Book>(`books.${book1Id}`);
    });

    it('with no arguments - increments model value by 1', () => {
      const publishedAtModel = book1Model.at<number>('publishedAt');
      const returnValue = publishedAtModel.increment();
      expect(returnValue).to.equal(101);
      expect(book1Model.get()).to.have.property('publishedAt', 101);
    });

    it('with positive number argument - increments model value by that number', () => {
      const publishedAtModel = book1Model.at<number>('publishedAt');
      const returnValue = publishedAtModel.increment(25);
      expect(returnValue).to.equal(125);
      expect(book1Model.get()).to.have.property('publishedAt', 125);
    });

    it('with negative number argument - decrements model value by that number', () => {
      const publishedAtModel = book1Model.at<number>('publishedAt');
      const returnValue = publishedAtModel.increment(-25);
      expect(returnValue).to.equal(75);
      expect(book1Model.get()).to.have.property('publishedAt', 75);
    });

    it('with subpath argument - increments model value by 1', () => {
      const returnValue = rootModel.increment(`books.${book1Id}.publishedAt`);
      expect(returnValue).to.equal(101);
      expect(book1Model.get()).to.have.property('publishedAt', 101);
    });

    it('with subpath and number arguments - increments model value by that number', () => {
      const returnValue = rootModel.increment(
        `books.${book1Id}.publishedAt`,
        25
      );
      expect(returnValue).to.equal(125);
      expect(book1Model.get()).to.have.property('publishedAt', 125);
    });
  });

  describe('push', () => {
    let book: Book;
    let bookId: string;
    let bookModel: Model<Book>;
    beforeEach(() => {
      book = {
        id: 'my-book',
        pages: [],
      };
      bookId = rootModel.add('books', book);
      bookModel = rootModel.at<Book>(`books.${bookId}`);
    });

    it('onto pre-existing array', () => {
      const pagesModel = bookModel.at<Page[]>('pages');
      const returnValue1 = pagesModel.push({ text: 'Page 1' });
      expect(returnValue1).to.equal(1);
      expect(bookModel.get())
        .to.have.property('pages')
        .eql([{ text: 'Page 1' }]);
      const returnValue2 = pagesModel.push({ text: 'Page 2' });
      expect(returnValue2).to.equal(2);
      expect(bookModel.get())
        .to.have.property('pages')
        .eql([{ text: 'Page 1' }, { text: 'Page 2' }]);
    });

    it('onto path with no value will first set a new array', () => {
      bookModel.del('pages');
      expect(bookModel.get()).to.not.have.property('pages');

      const returnValue = bookModel.push('pages', { text: 'Page 1' });
      expect(returnValue).to.equal(1);
      expect(bookModel.get())
        .to.have.property('pages')
        .eql([{ text: 'Page 1' }]);
    });
  });

  describe('insert', () => {
    let book: Book;
    let bookId: string;
    let bookModel: Model<Book>;
    let pagesModel: Model<Page[]>;
    beforeEach(() => {
      book = {
        id: 'my-book',
        pages: [],
      };
      bookId = rootModel.add('books', book);
      bookModel = rootModel.at<Book>(`books.${bookId}`);
      pagesModel = bookModel.at<Page[]>('pages');
    });

    it('with single new item', () => {
      const returnValue1 = pagesModel.insert(0, { text: 'Page 3' });
      expect(returnValue1).to.equal(1);
      expect(bookModel.get())
        .to.have.property('pages')
        .eql([{ text: 'Page 3' }]);
      const returnValue2 = pagesModel.insert(0, { text: 'Page 1' });
      expect(returnValue2).to.equal(2);
      expect(bookModel.get())
        .to.have.property('pages')
        .eql([{ text: 'Page 1' }, { text: 'Page 3' }]);
      const returnValue3 = pagesModel.insert(1, { text: 'Page 2' });
      expect(returnValue3).to.equal(3);
      expect(bookModel.get())
        .to.have.property('pages')
        .eql([{ text: 'Page 1' }, { text: 'Page 2' }, { text: 'Page 3' }]);
    });

    it('with array of new items', () => {
      const returnValue1 = pagesModel.insert(0, [{ text: 'Page 3' }]);
      expect(returnValue1).to.equal(1);
      expect(bookModel.get())
        .to.have.property('pages')
        .eql([{ text: 'Page 3' }]);
      const returnValue2 = pagesModel.insert(0, [
        { text: 'Page 1' },
        { text: 'Page 2' },
      ]);
      expect(returnValue2).to.equal(3);
      expect(bookModel.get())
        .to.have.property('pages')
        .eql([{ text: 'Page 1' }, { text: 'Page 2' }, { text: 'Page 3' }]);
      const returnValue3 = pagesModel.insert(2, [
        { text: 'Page 2.1' },
        { text: 'Page 2.2' },
      ]);
      expect(returnValue3).to.equal(5);
      expect(bookModel.get())
        .to.have.property('pages')
        .eql([
          { text: 'Page 1' },
          { text: 'Page 2' },
          { text: 'Page 2.1' },
          { text: 'Page 2.2' },
          { text: 'Page 3' },
        ]);
    });
  });

  describe('remove', () => {
    let book: Book;
    let bookId: string;
    let bookModel: Model<Book>;
    let pagesModel: Model<Page[]>;
    beforeEach(() => {
      book = {
        id: 'my-book',
        pages: [],
      };
      bookId = rootModel.add('books', book);
      bookModel = rootModel.at<Book>(`books.${bookId}`);
      pagesModel = bookModel.at<Page[]>('pages');
      pagesModel.set([
        { text: 'Page 1' },
        { text: 'Page 2' },
        { text: 'Page 3' },
      ]);
    });

    it('default of one item', () => {
      const removedItems = pagesModel.remove(1);
      expect(removedItems).to.eql([{ text: 'Page 2' }]);
      expect(bookModel.get())
        .to.have.property('pages')
        .eql([{ text: 'Page 1' }, { text: 'Page 3' }]);
    });

    it('three items', () => {
      const removedItems = pagesModel.remove(0, 3);
      expect(removedItems).to.eql([
        { text: 'Page 1' },
        { text: 'Page 2' },
        { text: 'Page 3' },
      ]);
      expect(bookModel.get())
        .to.have.property('pages')
        .eql([]);
    });
  });

  //
  // Fetch, subscribe
  //

  describe('document fetch', () => {
    let book: Book;
    let bookId: string;
    let clientModel: RootModel;
    beforeEach(done => {
      book = {
        id: 'my-book',
        author: { id: 'alex-uuid', name: 'Alex' },
        pages: [],
        publishedAt: 1234,
      };
      bookId = rootModel.add('books', book);
      clientModel = backend.createModel();
      rootModel.whenNothingPending(done);
    });

    function testDocFetch(toFetch: racer.Subscribable, done: MochaDone) {
      clientModel.fetch(toFetch, err => {
        if (err) {
          return done(err);
        }
        expect(clientModel.get('books')).eql({
          'my-book': book,
        });
        // A "remote" change shouldn't show up in the model.
        rootModel.set(`books.${bookId}.publishedAt`, 5678, () => {
          expect(clientModel.get(`books.${bookId}.publishedAt`)).eql(1234);
          done();
        });
      });
    }

    it('with collection+id string', done => {
      testDocFetch(`books.${bookId}`, done);
    });

    it('with scoped model', done => {
      const bookModel = clientModel.at<Book>(`books.${bookId}`);
      testDocFetch(bookModel, done);
    });
  });

  describe('document subscribe', () => {
    let book: Book;
    let bookId: string;
    let clientModel: RootModel;
    beforeEach(done => {
      book = {
        id: 'my-book',
        author: { id: 'alex-uuid', name: 'Alex' },
        pages: [],
        publishedAt: 1234,
      };
      bookId = rootModel.add('books', book);
      clientModel = backend.createModel();
      rootModel.whenNothingPending(done);
    });

    function testDocSubscribe(toFetch: racer.Subscribable, done: MochaDone) {
      clientModel.subscribe(toFetch, err => {
        if (err) {
          return done(err);
        }
        expect(clientModel.get('books')).eql({
          'my-book': book,
        });
        // A "remote" change should show up in the model.
        rootModel.set(`books.${bookId}.publishedAt`, 5678, () => {
          // Change is done, but it will take one more tick for the change to
          // propagate to the other subscribed model.
          process.nextTick(() => {
            expect(clientModel.get(`books.${bookId}.publishedAt`)).eql(5678);
            done();
          });
        });
      });
    }

    it('with collection+id string', done => {
      testDocSubscribe(`books.${bookId}`, done);
    });

    it('with scoped model', done => {
      const bookModel = clientModel.at<Book>(`books.${bookId}`);
      testDocSubscribe(bookModel, done);
    });
  });

  describe('query subscribe', () => {
    let book: Book;
    let bookId: string;
    let clientModel: RootModel;
    beforeEach(done => {
      book = {
        id: 'my-book',
        author: { id: 'alex-uuid', name: 'Alex' },
        pages: [],
        publishedAt: 1234,
      };
      bookId = rootModel.add('books', book);
      clientModel = backend.createModel();
      rootModel.whenNothingPending(done);
    });

    function verifyRemoteChange(query: racer.Query<Book>, done: MochaDone) {
      const books: Book[] = query.get();
      expect(books).eql([book]);
      // A "remote" change should show up in the model.
      rootModel.set(`books.${bookId}.publishedAt`, 5678, () => {
        // Change is done, but it will take one more tick for the change to
        // propagate to the other subscribed model.
        process.nextTick(() => {
          expect(clientModel.get(`books.${bookId}.publishedAt`)).eql(5678);
          done();
        });
      });
    }

    it('with Query#subscribe(cb)', done => {
      const query = clientModel.query('books', {});
      query.subscribe(err => {
        if (err) {
          return done(err);
        }
        verifyRemoteChange(query, done);
      });
    });

    it('with Model#subscribe(query, cb)', done => {
      const query = clientModel.query('books', {});
      clientModel.subscribe(query, err => {
        if (err) {
          return done(err);
        }
        verifyRemoteChange(query, done);
      });
    });

    it('picks up new docs', done => {
      const query = clientModel.query('books', {});
      query.subscribe(err => {
        if (err) {
          return done(err);
        }
        let books: Book[] = query.get();
        expect(books).eql([book]);
        // A "remote" addition should show up in the model.
        const newBook = {
          id: 'new-book',
          pages: [],
        };
        rootModel.add('books', newBook);
        rootModel.whenNothingPending(() => {
          // Change is done, but it will take one more tick for the change to
          // propagate to the other subscribed model.
          process.nextTick(() => {
            books = query.get();
            expect(books).eql([book, newBook]);
            done();
          });
        });
      });
    });
  });
});
