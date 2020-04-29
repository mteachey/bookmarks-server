const express = require('express');
const xss = require('xss')

const bookmarkRouter = express.Router();
const bodyParser = express.json();
const { v4: uuid} = require('uuid');
const logger = require('../logger');
const { bookmarks } = require('../bookmarks.js')
const BookmarksService = require('../bookmarks-service.js')

const serializeBookmark = bookmark =>({
    id:bookmark.id,
    title:xss(bookmark.title),
    url:xss(bookmark.url),
    description:xss(bookmark.description),
    rating:bookmark.rating
})

const validRatings = [1,2,3,4,5];

bookmarkRouter
    .route('/bookmarks')
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

       const newBookmark = { description, rating, title, url }

       for (const [key, value] of Object.entries(newBookmark)){
           if(value == null && key !== description){ //descrip not req'd
               return res.status(400).json({
                   error: { message : `Missing '${key}' in request body`}
               })
           }
       }

       if(rating){
            if(!validRatings.includes(Number(rating))){
                logger.error(`Rating must be a number 1-5`);
                return res
                 .status(400)
                 .json({error : {message : 'Invalid data'}});
            }
        }

        BookmarksService.insertBookmark(
            req.app.get('db'),
            newBookmark
        )
        .then(bookmark => {
            logger.info(`Bookmark with id ${bookmark.id} created`);

            res
            .status(201)
            .location(`/bookmarks/${bookmark.id}`)
            .json(serializeBookmark(bookmark));
        })
        .catch(next)
    })//end route POST /bookmarks

bookmarkRouter
    .route('/bookmarks/:bookmark_id')
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
        res.json({
            id:res.bookmark.id,
            title:xss(res.bookmark.title),
            url:xss(res.bookmark.url),
            description:xss(res.bookmark.description),
            rating:res.bookmark.rating
        })
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

module.exports=bookmarkRouter;