const knex = require('knex');
const app = require('../src/app');
const { makeBookmarksArray, makeMaliciousBookmark } = require('./bookmarks.fixtures');

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

    describe('GET /api/bookmarks', ()=>{
    
        context('Given no bookmarks',()=>{
            it('responds with 200 and en empty list',()=>{
                return supertest(app)
                    .get('/api/bookmarks')
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
                    .get('/api/bookmarks')
                    .expect(200, testBookmarks)
            })//end of it all bookmarks given bookmarks
        })//end of context given bookmarks in db

        context(`Given an XSS attack article`, () => {
            const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark()
      
            beforeEach('insert malicious bookmark', () => {
              return db
                .into('bookmarks')
                .insert([ maliciousBookmark ])
            })
      
            it('removes XSS attack content', () => {
              return supertest(app)
                .get(`/api/bookmarks`)
                .expect(200)
                .expect(res => {
                  expect(res.body[0].title).to.eql(expectedBookmark.title)
                  expect(res.body[0].description).to.eql(expectedBookmark.description)
                })
            })//end it XSS
        })//end contex XSS

    })//end of GET /bookmark endpoint

    describe('/api/bookmarks/:bookmark_id',()=>{
        context('Given no bookmarks',()=>{
            it(`responds with 404`,()=>{
                const bookmarkId = 123
                return supertest(app)
                    .get(`/api/bookmarks/${bookmarkId}`)
                    .expect(404, {error: {message:`Bookmark doesn't exist`}})
            })
        })//end context no bookmarks

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
                    .get(`/api/bookmarks/${bookmarkId}`)
                    .expect(200, expectedBookmark)            
            })//end it responds with article
        })//end context given bookmarks in db

        context(`Given an XSS attack article`, () => {
            const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark()
            
            beforeEach('insert malicious bookmark', () => {
                return db
                .into('bookmarks')
                .insert([ maliciousBookmark ])
            })
            
            it('removes XSS attack content', () => {
                return supertest(app)
                .get(`/api/bookmarks/${maliciousBookmark.id}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.title).to.eql(expectedBookmark.title)
                    expect(res.body.description).to.eql(expectedBookmark.description)
                })
            })//end it remves XSS
        })//end of contxt for XSS

    })//end describe /api/bookmarks/:bookmark_id endpoint group

    describe('POST /api/bookmarks endpoint',()=>{

        it('creates a bookmark, responding with 201 and the new bookmark',()=>{
            const newBookmark = {
                description:"Newer Test Bookmark",
                rating:3,
                title:"Test",
                url:"https://www.test.com"
            }
            return supertest(app)
                .post('/api/bookmarks')
                .send(newBookmark)
                .expect(res=>{
                    expect(res.body.title).to.eql(newBookmark.title)
                    expect(res.body.url).to.eql(newBookmark.url)
                    expect(res.body.description).to.eql(newBookmark.description)
                    expect(res.body.rating).to.eql(newBookmark.rating)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`)
                })
                .then(postRes=>{
                    supertest(app)
                        .get(`/api/bookmarks/${postRes.body.id}`)
                        expect(postRes.body)
                })
        })//end of it creates bookmark

        const requiredFields = ['rating', 'title', 'url']

        requiredFields.forEach(field=>{
            const newBookmark ={
                rating:3,
                title:"Test",
                url:"https://www.test.com",
                description:`Missing '${field}' in request body`,
            }

            it(`responds with 400 an an error message when the ${field} is missing`,()=>{
                delete newBookmark[field]

                return supertest(app)
                    .post('/api/bookmarks')
                    .send(newBookmark)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body` }
                    })
            })//end of 400 it
        })//end of foreach

        it(`responding with 400 an error message if rating isn't 1-5`,()=>{
            const newBookmark = {
                description:"Newer Test Bookmark",
                rating:"8",
                title:"Test",
                url:"https://www.test.com"
            }
            return supertest(app)
                    .post('/api/bookmarks')
                    .send(newBookmark)
                    .expect(400, {
                        error: { message: `'rating' must be a number between 0 and 5` }
                    })
        })//end of it creates bookmark

        it('removes XSS attack content from response', () => {
            const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark()
            return supertest(app)
              .post(`/api/bookmarks`)
              .send(maliciousBookmark)
              .expect(201)
              .expect(res => {
                expect(res.body.title).to.eql(expectedBookmark.title)
                expect(res.body.description).to.eql(expectedBookmark.description)
              })
          })

    })//end of POST endpoint

    describe(`DELETE /api/bookmarks/:bookmark_id`,()=>{

        context(`Given no bookmarks`,()=>{
            it(`responds with 404`,()=>{
                const bookmarkId = 12345
                return supertest(app)
                    .delete(`/api/bookmarks/${bookmarkId}`)
                    .expect(404, {error: { message: `Bookmark doesn't exist` }})
            })
        })//end context no bookmarks

        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray()
            
            beforeEach('insert bookmarks', () => {
                return db
                .into('bookmarks')
                .insert(testBookmarks)
            })
            
            it('responds with 204 and removes the bookmark', () => {
                const idToRemove = 2
                const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove)
                return supertest(app)
                    .delete(`/api/bookmarks/${idToRemove}`)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                        .get(`/api/bookmarks`)
                        .expect(expectedBookmarks)
                    )
            })//end of it remv art
        })//end of contex given art
    })//end of DELETE endpoint

    describe.only(`PATCH /api/bookmarks/:bookmark_id`,()=>{
        context(`Given no bookmarks`,()=>{
            it(`responds with 404`,()=>{
                const idToUpdate = 12345 //doesn't exist
                return supertest(app)
                    .patch(`/api/bookmarks/${idToUpdate}`)
                    .expect(404, { error: { message: `Bookmark doesn't exist` }})
            })
        })//end context given no bookmarks

        const testBookmarks = makeBookmarksArray()

        beforeEach('insert bookmarks',()=>{
            return db
            .into('bookmarks')
            .insert(testBookmarks)
        })

        context(`Given bookmarks in database`,()=>{
            it(`responds with 204 and updates the bookmark`,()=>{
                const idToUpdate = 2
                const updateBookmark = {
                    rating:3,
                    title:"Update Bookmark",
                    url:"https://www.updatedurl.com",
                    description:`updated bookmark description`,
                }
                const expectedBookmark = {
                    ...testBookmarks[idToUpdate - 1],
                    ...updateBookmark
                }
                return supertest(app)
                    .patch(`/api/bookmarks/${idToUpdate}`)
                    .send(updateBookmark)
                    .expect(204)
                    .then(res=>{
                        supertest(app)
                            .get(`/api/bookmarks/${idToUpdate}`)
                            .expect(expectedBookmark)
                    })
            })//end of it update

            it(`responds with 400 when no req'd fields`,()=>{
                const idToUpdate = 2
                return supertest(app)
                    .patch(`/api/bookmarks/${idToUpdate}`)
                    .send( {irrelaventField: 'foo'} )
                    .expect(400, {
                        error: {
                            message: `Request body must contain either 'title', 'url', 'rating' or 'description'`
                        }
                    })
            })//end of it no req'd fields

            it(`responds with 204 when updating only a subset`,()=>{
                const idToUpdate = 2
                const updateBookmark = {
                    title: 'updated title',
                }

                const expectedBookmark = {
                    ...testBookmarks[idToUpdate - 1],
                    ...updateBookmark
                }

                return supertest(app)
                    .patch(`/api/bookmarks/${idToUpdate}`)
                    .send({
                        ...updateBookmark,
                        fieldToIgnore:'should not be in GET response'
                    })
                    .expect(204)
                    .then(res=>{
                        supertest(app)
                            .get(`/api/bookmarks/${idToUpdate}`)
                            .expect(expectedBookmark)
                    })
            })//end of it subset

        })//end context with bookmarks in db

    })//end of describe PATCH

}) //end Endpoints group