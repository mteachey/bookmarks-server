const express = require('express');

const bookmarkRouter = express.Router();
const bodyParser = express.json();
const { v4: uuid} = require('uuid');
const logger = require('../logger');
const { bookmarks } = require('../bookmarks.js')

bookmarkRouter
    .route('/bookmarks')
    .get((req, res)=>{
        res
        .json(bookmarks);
    })
    .post(bodyParser, (req, res)=>{
       const {description, rating, title, url } = req.body;

       if(!description){
           logger.error(`Description is required`);
           return res
            .status(400)
            .send('Invalid data');
       }
       if(!rating){
        logger.error(`Rating is required`);
        return res
         .status(400)
         .send('Invalid data');
        }
        if(!title){
            logger.error(`Title is required`);
            return res
            .status(400)
            .send('Invalid data');
        }

        if(!url){
            logger.error(`URL is required`);
            return res
             .status(400)
             .send('Invalid data');
        }

        //generate ID and push bookmark array
        const id = uuid();

        const bookmark ={
            id,
            description, 
            rating,
            title,
            url,
        }

        bookmarks.push(bookmark);

        //log creation and send response
        logger.info(`Bookmark with id ${id} created`);
        res
            .status(201)
            .location(`http://localhose:8000/bookmarks/${id}`)
            .json(bookmark);

    })//end route POST /bookmarks

bookmarkRouter
    .route('/bookmarks/:id')
    .get((req, res)=>{
        const { id } = req.params;
        const bookmark = bookmarks.find(b =>b.id == id);

        if(!bookmark){
            logger.error(`Bookmark with id ${id} not found`);
            return res
                .status(404)
                .send('Bookmark Not Found');
        }

        res.json(bookmark);

    })
    .delete((req, res)=>{
        const { id } = req.params;

        const index = bookmarks.findIndex(b => b.id===id);

        // make sure we actually have a bookmark with that id
        if (index === -1) {
          return res
            .status(404)
            .send('Bookmark not found');
        }
      
        bookmarks.splice(index, 1);

        logger.info(`Bookmark with id ${id} deleted`);
        res
            .status(204)
            .end();
    })

module.exports=bookmarkRouter;