// tslint:disable: only-arrow-functions - Need to use function() for Mocha "this" context.

import expect = require('expect.js');
import racer = require('../lib');
import {Model, RootModel, CollectionData} from '../lib';

interface Book {
  author?: Author;
  pages: Page[];
  publishedAt?: number;
}

interface Author {
  id: string;
  name: string;
}

// Make sure both interfaces and types work as Model generic types.
type Page = {
  text: string;
};

// Use TypeScript module augmentation on the root model's ModelData to add
// information on each collection's document types.
//
// In actual usages of Racer, this would look like:
//
//   import racer = require('racer');
//   declare module 'racer' { ... }
declare module '../lib' {
  interface ModelData {
    books: racer.CollectionData<Book>;
  }
}

describe('TypeScript Model', function() {
  let rootModel: RootModel;
  beforeEach(function() {
    const backend = racer.createBackend({
      disableDocAction: true,
      disableSpaceDelimitedActions: true,
    });
    rootModel = backend.createModel();
  });

  //
  // Getters
  //

  describe('get', function() {
    let book1: Book;
    let book1Id: string;
    beforeEach(function() {
      book1 = {
        author: {id: 'alex-uuid', name: 'Alex'},
        pages: [],
        publishedAt: 1234,
      };
      book1Id = rootModel.add('books', book1);
    });

    describe('with root model', function() {
      it('can return a whole document', function() {
        const book = rootModel.get(['books', book1Id]);
        expect(book).to.eql(book1);
      });

      it('can return a document field', function() {
        const author = rootModel.get(['books', book1Id, 'author']);
        expect(author).to.eql(book1.author);
      });

      it('can return a document subfield', function() {
        const authorName = rootModel.get(['books', book1Id, 'author', 'name']);
        expect(authorName).to.eql('Alex');
      });

      it('returns undefined for a non-existent value', function() {
        const nonExistentBook = rootModel.get(['books', 'non-existent']);
        expect(nonExistentBook).to.be(undefined);
      });

      it('returns values by reference', function() {
        // Model#get returns values by reference, so for an object value, a
        // later change to a property via model methods should be reflected in the
        // previously returned object.
        const book = rootModel.get(['books', book1Id]);
        expect(book).to.have.property('publishedAt', 1234);
        rootModel.set(['books', book1Id, 'publishedAt'], 5678);
        expect(book).to.have.property('publishedAt', 5678);
      });
    });

    describe('with child model', function() {
      let bookModel: Model<Book>;
      beforeEach(function() {
        bookModel = rootModel.at(['books', book1Id]);
      });

      it('can return a whole document', function() {
        const book = bookModel.get();
        expect(book).to.eql(book1);
      });

      it('can return a document field', function() {
        const author = bookModel.get(['author']);
        expect(author).to.eql(book1.author);
      });

      it('can return a document subfield', function() {
        const authorName = bookModel.get(['author', 'name']);
        expect(authorName).to.eql('Alex');
      });

      it('returns undefined for a non-existent value', function() {
        const nonExistent = bookModel.get(['pages', 12]);
        expect(nonExistent).to.be(undefined);
      });
    });
  });

  //
  // Mutators
  //

  describe('increment', function() {
    let book1: Book;
    let book1Id: string;
    let book1Model: Model<Book>;
    beforeEach(function() {
      book1 = {
        pages: [],
        publishedAt: 100,
      };
      book1Id = rootModel.add('books', book1);
      book1Model = rootModel.at(['books', book1Id]);
    });

    it('with no arguments - increments model value by 1', function() {
      const publishedAtModel = book1Model.at(['publishedAt']);
      const returnValue = publishedAtModel.increment();
      expect(returnValue).to.equal(101);
      expect(book1Model.get()).to.have.property('publishedAt', 101);
    });

    it('with positive number argument - increments model value by that number', function() {
      const publishedAtModel = book1Model.at(['publishedAt']);
      const returnValue = publishedAtModel.increment(25);
      expect(returnValue).to.equal(125);
      expect(book1Model.get()).to.have.property('publishedAt', 125);
    });

    it('with negative number argument - decrements model value by that number', function() {
      const publishedAtModel = book1Model.at(['publishedAt']);
      const returnValue = publishedAtModel.increment(-25);
      expect(returnValue).to.equal(75);
      expect(book1Model.get()).to.have.property('publishedAt', 75);
    });

    it('with subpath argument - increments model value by 1', function() {
      const returnValue = rootModel.increment(['books', book1Id, 'publishedAt']);
      expect(returnValue).to.equal(101);
      expect(book1Model.get()).to.have.property('publishedAt', 101);
    });

    it('with subpath and number arguments - increments model value by that number', function() {
      const returnValue = rootModel.increment(['books', book1Id, 'publishedAt'], 25);
      expect(returnValue).to.equal(125);
      expect(book1Model.get()).to.have.property('publishedAt', 125);
    });
  });

  describe('push', function() {
    let book: Book;
    let bookId: string;
    let bookModel: Model<Book>;
    beforeEach(function() {
      book = {
        pages: [],
      };
      bookId = rootModel.add('books', book);
      bookModel = rootModel.at(['books', bookId]);
    });

    it('onto pre-existing array', function() {
      const pagesModel = bookModel.at(['pages']);
      const returnValue1 = pagesModel.push({text: 'Page 1'});
      expect(returnValue1).to.equal(1);
      expect(bookModel.get()).to.have.property('pages').eql([
        {text: 'Page 1'},
      ]);
      const returnValue2 = pagesModel.push({text: 'Page 2'});
      expect(returnValue2).to.equal(2);
      expect(bookModel.get()).to.have.property('pages').eql([
        {text: 'Page 1'},
        {text: 'Page 2'},
      ]);
    });

    it('onto path with no value will first set a new array', function() {
      bookModel.del(['pages']);
      expect(bookModel.get()).to.not.have.property('pages');

      const returnValue = bookModel.push(['pages'], {text: 'Page 1'});
      expect(returnValue).to.equal(1);
      expect(bookModel.get()).to.have.property('pages').eql([
        {text: 'Page 1'},
      ]);
    });
  });

  describe('insert', function() {
    let book: Book;
    let bookId: string;
    let bookModel: Model<Book>;
    let pagesModel: Model<Page[]>;
    beforeEach(function() {
      book = {
        pages: [],
      };
      bookId = rootModel.add('books', book);
      bookModel = rootModel.at(['books', bookId]);
      pagesModel = bookModel.at(['pages']);
    });

    it('with single new item', function() {
      const returnValue1 = pagesModel.insert(0, {text: 'Page 3'});
      expect(returnValue1).to.equal(1);
      expect(bookModel.get()).to.have.property('pages').eql([
        {text: 'Page 3'},
      ]);
      const returnValue2 = pagesModel.insert(0, {text: 'Page 1'});
      expect(returnValue2).to.equal(2);
      expect(bookModel.get()).to.have.property('pages').eql([
        {text: 'Page 1'},
        {text: 'Page 3'},
      ]);
      const returnValue3 = pagesModel.insert(1, {text: 'Page 2'});
      expect(returnValue3).to.equal(3);
      expect(bookModel.get()).to.have.property('pages').eql([
        {text: 'Page 1'},
        {text: 'Page 2'},
        {text: 'Page 3'},
      ]);
    });

    it('with array of new items', function() {
      const returnValue1 = pagesModel.insert(0, [{text: 'Page 3'}]);
      expect(returnValue1).to.equal(1);
      expect(bookModel.get()).to.have.property('pages').eql([
        {text: 'Page 3'},
      ]);
      const returnValue2 = pagesModel.insert(0, [{text: 'Page 1'}, {text: 'Page 2'}]);
      expect(returnValue2).to.equal(3);
      expect(bookModel.get()).to.have.property('pages').eql([
        {text: 'Page 1'},
        {text: 'Page 2'},
        {text: 'Page 3'},
      ]);
      const returnValue3 = pagesModel.insert(2, [{text: 'Page 2.1'}, {text: 'Page 2.2'}]);
      expect(returnValue3).to.equal(5);
      expect(bookModel.get()).to.have.property('pages').eql([
        {text: 'Page 1'},
        {text: 'Page 2'},
        {text: 'Page 2.1'},
        {text: 'Page 2.2'},
        {text: 'Page 3'},
      ]);
    });
  });

  describe('remove', function() {
    let book: Book;
    let bookId: string;
    let bookModel: Model<Book>;
    let pagesModel: Model<Page[]>;
    beforeEach(function() {
      book = {
        pages: [],
      };
      bookId = rootModel.add('books', book);
      bookModel = rootModel.at(['books', bookId]);
      pagesModel = bookModel.at(['pages']);
      pagesModel.set([{text: 'Page 1'}, {text: 'Page 2'}, {text: 'Page 3'}]);
    });

    it('default of one item', function() {
      const removedItems = pagesModel.remove(1);
      expect(removedItems).to.eql([{text: 'Page 2'}]);
      expect(bookModel.get()).to.have.property('pages').eql([
        {text: 'Page 1'},
        {text: 'Page 3'},
      ]);
    });

    it('three items', function() {
      const removedItems = pagesModel.remove(0, 3);
      expect(removedItems).to.eql([
        {text: 'Page 1'},
        {text: 'Page 2'},
        {text: 'Page 3'},
      ]);
      expect(bookModel.get()).to.have.property('pages').eql([]);
    });
  });
});
