firebase.auth().onAuthStateChanged(async function(user) {
  if (user) {
    // Signed in
    console.log('signed in')

    // Sign-out button
    document.querySelector('.sign-in-or-sign-out').innerHTML = `
      <button class="text-pink-500 underline sign-out">Sign Out</button>
    `
    document.querySelector('.sign-out').addEventListener('click', function(event) {
      console.log('sign out clicked')
      firebase.auth().signOut()
      document.location.href = 'index.html'
    })

    // Listen for the form submit and create/render the new post
    document.querySelector('form').addEventListener('submit', async function(event) {
      event.preventDefault()
      // we want to capture the userId, projectUsername, projectID, projectDesc. I left all variables the same for now, EXCEPT, i got rid of "imageUrl" and replaced it with "projectDesc" because users will submit a written project description rather than an image, as they did in Kelloggram
      let projectUsername = user.displayName
      let projectDesc = document.querySelector('#project-desc').value
      let response = await fetch('/.netlify/functions/create_post', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.uid,
          username: projectUsername,
          projectDesc: projectDesc
        })
      })
      let post = await response.json()
      document.querySelector('#project-desc').value = '' // clear the image url field
      renderPost(post)
    })

    let response = await fetch('/.netlify/functions/get_posts')
    let posts = await response.json()
    for (let i=0; i<posts.length; i++) {
      let post = posts[i]
      renderPost(post)
    }
  } else {
    // Signed out
    console.log('signed out')

    // Hide the form when signed-out
    document.querySelector('form').classList.add('hidden')

    // Initializes FirebaseUI Auth
    let ui = new firebaseui.auth.AuthUI(firebase.auth())

    // FirebaseUI configuration
    let authUIConfig = {
      signInOptions: [
        firebase.auth.EmailAuthProvider.PROVIDER_ID
      ],
      signInSuccessUrl: 'index.html'
    }

    // Starts FirebaseUI Auth
    ui.start('.sign-in-or-sign-out', authUIConfig)
  }
})

// given a single post Object, render the HTML and attach event listeners
// expects an Object that looks similar to:
// {
//   id: 'abcdefg',
//   username: 'brian',
//   imageUrl: 'https://images.unsplash.com/...',
//   likes: 12,
//   comments: [
//     { username: 'brian', text: 'i love tacos!' },
//     { username: 'ben', text: 'fake news' }
//   ]
// }
async function renderPost(post) {
  let postId = post.id
  

  // setup a table in the html below so that the like button displays next to the comments. we still need to figure out how to add more like buttons and to associate one with each comment rather than just showing one like button per post. In the "comments" code below, i found out how to grab the comment ID, and i think we need to incorporate that into this html so that the likes get attached to a commentId rather than a postId
  document.querySelector('.posts').insertAdjacentHTML('beforeend', `
    <div class="post-${postId} md:mt-16 mt-8 space-y-8">
      <div class="md:mx-0 mx-4">
        <span class="font-bold text-xl">${post.username}</span>
      </div>

      <div class="w-full">
        ${post.projectDesc}
      </div>

      <div class="comments text-sm md:mx-0 mx-4 space-y-2">
        <table>
          <tr>
            <td>${renderComments(post.comments)}</td>
            <td><button class="like-button">❤️</button></td>
            <td><span class="likes">${post.likes}</span></td>
        </table>
      </div>

      

      <div class="w-full md:mx-0 mx-4">
        ${renderCommentForm()}
      </div>
    </div>
  `)

  // listen for the like button on this post
  let likeButton = document.querySelector(`.post-${postId} .like-button`)
  likeButton.addEventListener('click', async function(event) {
    event.preventDefault()
    console.log(`comment ${postId} like button clicked!`)
    let currentUserId = firebase.auth().currentUser.uid

    let response = await fetch('/.netlify/functions/like', {
      method: 'POST',
      body: JSON.stringify({
        postId: postId,
        userId: currentUserId
      })
    })
    if (response.ok) {
      let existingNumberOfLikes = document.querySelector(`.post-${postId} .likes`).innerHTML
      let newNumberOfLikes = parseInt(existingNumberOfLikes) + 1
      document.querySelector(`.post-${postId} .likes`).innerHTML = newNumberOfLikes
    }
  })

  // listen for the post comment button on this post
  let postCommentButton = document.querySelector(`.post-${postId} .post-comment-button`)
  postCommentButton.addEventListener('click', async function(event) {
    event.preventDefault()
    console.log(`post ${postId} post comment button clicked!`)

    // get the text of the comment
    let postCommentInput = document.querySelector(`.post-${postId} input`)
    let newCommentText = postCommentInput.value
    console.log(`comment: ${newCommentText}`)

    // create a new Object to hold the comment's data
    let newComment = {
      postId: postId,
      username: firebase.auth().currentUser.displayName,
      text: newCommentText,
    }

    // call our back-end lambda using the new comment's data
    let commentResponse = await fetch('/.netlify/functions/create_comment', {
      method: 'POST',
      body: JSON.stringify(newComment)
      
    })

    //capture the comment id, which will be used to associate the likes to the comments -- need to figure out how to associate the likes to the comment instead of the post. We want a heart button next to each comment.
    console.log(newComment.text)
    let comment = await commentResponse.json()
    commentId = comment.id
    console.log(comment.id)

    // insert the new comment into the DOM, in the div with the class name "comments", for this post
    let commentsElement = document.querySelector(`.post-${postId} .comments-${commentId}`)
    commentsElement.insertAdjacentHTML('beforeend', renderComment(newComment))

    // clears the comment input
    postCommentInput.value = ''
  })
}

// given an Array of comment Objects, loop and return the HTML for the comments
function renderComments(comments) {
  if (comments) {
    let markup = ''
    for (let i = 0; i < comments.length; i++) {
      markup += renderComment(comments[i])
      //console.log(commentId)
    }
    return markup
  } else {
    return ''
  }
}

// return the HTML for one comment, given a single comment Object
function renderComment(comment) {
  return `<div><strong>${comment.username}</strong> ${comment.text} ${comment.id}</div>`
}

// return the HTML for the new comment form
function renderCommentForm() {
  let commentForm = ''
  commentForm = `
    <input type="text" class="mr-2 rounded-lg border px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500" placeholder="Add a comment...">
    <button class="post-comment-button py-2 px-4 rounded-md shadow-sm font-medium text-white bg-purple-600 focus:outline-none">Post</button>
  `
  return commentForm
}
