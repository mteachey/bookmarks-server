const knex = require('knex');
const app = require('../src/app');
const { makeBookmarksArray } = require('./bookmarks.fixtures');

describe('Bookmarks Endpoints', ()=>{
  let db

    before('make knex instance',()=>{
        db = knex({
            client:'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db('bookmarks').truncate())

    afterEach('cleanup', () => db('bookmarks').truncate())

    describe('GET /bookmarks', ()=>{
    
        context('Given no bookmarks',()=>{
            it('responds with 200 and en empty list',()=>{
                return supertest(app)
                    .get('/bookmarks')
                    .expect(200, [])
            })//end of empty list
        })//end of no bookmarks group

        context('Given there are bookmarks in the database',()=>{
            const testBookmarks = makeBookmarksArray()

            beforeEach('insert bookmarks',()=>{
                return db  
                    .into('bookmarks')
                    .insert(testBookmarks)
            })//end of beforeEach

            it('responds with 200 and all bookmarks',()=>{
                return supertest(app)
                    .get('/bookmarks')
                    .expect(200, testBookmarks)
            })//end of all bookmarks given bookmarks
        })//end of given bookmarks in db

    })//end of /bookmark endpoint

    describe('/bookmarks/:bookmark_id',()=>{
        context('Given no bookmarks',()=>{
            it(`responds with 404`,()=>{
                const bookmarkId = 123
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .expect(404, {error: {message:`Bookmark Not Found`}})
            })
        })//end no bookmarks

        context('Given bookmarks in db',()=>{
            const testBookmarks = makeBookmarksArray()

            beforeEach('insert bookmarks',()=>{
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })//end beforeEach

            it('responds with 200 and the specified article',()=>{
                const bookmarkId = 1
                const expectedBookmark = testBookmarks[bookmarkId-1]
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .expect(200, expectedBookmark)
            
            })//end responds with article

        })//end given bookmarks in db

    })//end /bookmarks/:bookmark_id enpoint group


}) //end Endpoints group