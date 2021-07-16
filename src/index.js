const express = require("express");
const cors = require("cors");

//  cria um universal id
const { v4: uuidv4, v4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

// user array with it's todo list
const users = [];

function checksExistsTodo(request, response, next) {
  //given a todo id check if exists on an specific user todo list
  // must be called after the checksExistsUserAccount middleware
  const { user } = request;
  const id = request.params.id;
  console.log(`Searching todo by id = ${id}`);

  const todo = user.todos.find((element) => element.id === id);

  if (!todo) {
    return response
      .status("404")
      .json({ error: `Todo ${id} not found for user ${user.username}` });
  }

  request.todo = todo;
  return next();
}

function checksAlreadyExistsUserAccount(request, response, next) {
  //middleware requires 3 arguments: request, response e next
  const { username } = request.body;

  const user = users.find((element) => {
    return element.username === username;
  });

  //Returning error if the user is not found:
  if (user) {
    return response
      .status(400)
      .json({ error: `User ${username} already exists!` });
  }
  return next();
}

function checksExistsUserAccount(request, response, next) {
  //middleware requires 3 arguments: request, response e next
  const { username } = request.headers;
  console.log(username);
  if (!username) {
    return response.status(404).json({ error: `User not defined!` });
  }
  const user = users.find((user) => {
    return user.username === username;
  });

  //Returning error if the user is not found:cle
  if (!user) {
    return response.status(404).json({ error: `User ${username} not found!` });
  }
  // appending the selected user on the request
  request.user = user;
  return next();
}

app.post("/users", checksAlreadyExistsUserAccount, (request, response) => {
  //Creating a user object
  const { name, username } = request.body;
  const user = {
    id: v4(),
    name,
    username,
    todos: [],
  };
  //adding the new user to the user's array
  //?Can it be duplicated?
  users.push(user);
  response.status(201).json(user);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const user = request.user;
  console.log(user);
  return response.status(200).json(user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  //Getting the user returned by the middleware
  const { user } = request;
  //Getting the request parameters.
  const { title, deadline } = request.body;
  const todo = {
    id: v4(),
    title: title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  user.todos.push(todo);

  response.status(201).json(todo);
});

app.put(
  "/todos/:id",
  checksExistsUserAccount,
  checksExistsTodo,
  (request, response) => {
    // updating one todo
    const { title, deadline } = request.body;
    const todo = request.todo;
    todo.title = title;
    todo.deadline = new Date(deadline);
    return response.status(200).json(todo);
  }
);

app.patch(
  "/todos/:id/done",
  checksExistsUserAccount,
  checksExistsTodo,
  (request, response) => {
    // mark one todo as done
    const todo = request.todo;
    todo.done = true;
    response.status(200).json(todo);
  }
);

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const todos = request.user.todos;
  const id = request.params.id;
  const todoIndex = todos.findIndex((todo) => todo.id === id);
  if (todoIndex === -1) {
    return response.status(404).send({ error: `Todo not found` });
  }
  todos.splice(todoIndex, 1);
  response.status(204).send();
});

module.exports = app;
