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

   function makeMaliciousBookmark() {
    const maliciousBookmark = {
      id: 911,
      rating: '2',
      title: 'Naughty naughty very naughty <script>alert("xss");</script>',
      url:'Naughty naughty very naughty <script>alert("xss");</script>',
      description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`
    }
    const expectedBookmark = {
      ...maliciousBookmark,
      title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
      url:'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
      description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
    }
    return {
      maliciousBookmark,
      expectedBookmark,
    }
  }
   
   module.exports = {
       makeBookmarksArray,
       makeMaliciousBookmark,
   }