function makeBookmarksArray(){
    return[
       {
           "description":"Where we find everything else",
           "id": 1,
           "rating":4,
           "title":"Google",
           "url":"https://www.google.com"
       },
       {
           "description":"The only place to find web documentation",
           "id":2,
           "rating":5,
           "title":"MDN",
           "url":"https://developer.mozilla.org"
       },
       {
           "description":"Another bookmark",
           "id":3,
           "rating":5,
           "title":"Test",
           "url":"https://test.org"
       }
    ];
   } 
   
   module.exports = {
       makeBookmarksArray,
   }