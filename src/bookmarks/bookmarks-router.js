const express = require('express');
const xss = require('xss')
const path = require('path')
const { isWebUri } = require('valid-url')

const bookmarkRouter = express.Router();
const bodyParser = express.json();
const { v4: uuid} = require('uuid');
const logger = require('../logger');
const { bookmarks } = require('../bookmarks.js')
const BookmarksService = require('../bookmarks-service.js')

const serializeBookmark = bookmark =>({
    id:bookmark.id,
    title:xss(bookmark.title),
    url:bookmark.url,
    description:xss(bookmark.description),
    rating:bookmark.rating
})

bookmarkRouter
    .route('/')
    .get((req, res,next)=>{
        const knexInstance = req.app.get('db')
        BookmarksService.getAllBookmarks(knexInstance)
        .then(bookmarks=>{
            res
            .json(bookmarks.map(serializeBookmark));
        })
        .catch(next)
       
    })
    .post(bodyParser, (req, res, next)=>{
       const { description, rating, title, url } = req.body;

       const ratingNum = Number(rating);
       
       for (const field of ['title', 'url', 'rating']) {
        if (!req.body[field]) {
          logger.error(`${field} is required`)
          return res.status(400).send({
            error: { message : `Missing '${field}' in request body`}
          })
        }
      }
    
      if (!Number.isInteger(ratingNum) || ratingNum < 0 || ratingNum > 5) {
        logger.error(`Invalid rating '${rating}' supplied`)
        return res.status(400).send({
          error: { message: `'rating' must be a number between 0 and 5` }
        })
      }
  
      if (!isWebUri(url)) {
        logger.error(`Invalid url '${url}' supplied`)
        return res.status(400).send({
          error: { message: `'url' must be a valid URL` }
        })
      }
  
      const newBookmark = { title, url, description, rating }

        BookmarksService.insertBookmark(
            req.app.get('db'),
            newBookmark
        )
        .then(bookmark => {
            logger.info(`Bookmark with id ${bookmark.id} created`);

            res
            .status(201)
            .location(path.posix.join(req.originalUrl + `/${bookmark.id}`))
            .json(serializeBookmark(bookmark));
        })
        .catch(next)
    })//end route POST /bookmarks

bookmarkRouter
    .route('/:bookmark_id')
    .all((req,res,next)=>{
        BookmarksService.getById(
            req.app.get('db'),
            req.params.bookmark_id
        )
        .then(bookmark =>{
            if(!bookmark){
                return res.status(404).json({
                    error: { message: `Bookmark doesn't exist` }
                })
            }
            res.bookmark = bookmark
            next()
        })
        .catch(next)
    })
    .get((req, res, next)=>{
        res.json(serializeBookmark(res.bookmark))
    })
    .delete((req, res, next)=>{
        BookmarksService.deleteBookmark(
            req.app.get('db'),
            req.params.bookmark_id
        )
        .then(()=>{
            logger.info(`Bookmark with id ${req.params.bookmark_id}deleted`);
        res
            .status(204)
            .end();
        })
        .catch(next)       
    })
    .patch(bodyParser, (req, res, next)=>{
        const { title, url, description,rating } = req.body
        const bookmarkToUpdate = { title, url, description,rating }

        const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length

        if(numberOfValues === 0){
            return res.status(400).json({
                error: {
                    message: `Request body must contain either 'title', 'url', 'rating' or 'description'`
                }
            })
        }

        BookmarksService.updateBookmark(
            req.app.get('db'),
            req.params.bookmark_id,
            bookmarkToUpdate
        )
        .then(numRowsAffected=>{
            res.status(204).end()
        })
        .catch(next)
    })

module.exports=bookmarkRouter;