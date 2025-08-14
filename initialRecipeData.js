module.exports = [
    {
        id: 1,
        name: "Chicken Teriyaki",
        estimated_time: 45,
        servings: [1, 2, 4],
        ingredientsByServing: {
            1 : [
                { name: "Chicken cubed", quantity: "1/2 lb" },
                { name: "Soy Sauce", quantity: "1/4 cup" },
                { name: "Brown Sugar", quantity: "2 tbsp" },
                { name: "Salt", quantity: "" },
                { name: "Olive Oil", quantity: "" }
            ],
            2 : [
                { name: "Chicken cubed", quantity: "1 lb" },
                { name: "Soy Sauce", quantity: "1/2 cup" },
                { name: "Brown Sugar", quantity: "1/4 cup" },
                { name: "Salt", quantity: "" },
                { name: "Olive Oil", quantity: "" }
            ],
            4 : [
                { name: "Chicken cubed", quantity: "2 lb" },
                { name: "Soy Sauce", quantity: "1 cup" },
                { name: "Brown Sugar", quantity: "1/2 cup" },
                { name: "Salt", quantity: "" },
                { name: "Olive Oil", quantity: "" }
            ]
        },
        steps : [
            {
                id: 1,
                recipe_id: 1,
                step_order: 1,
                name: "Preheat Pot",
                duration: 5,
                instructions: "Turn on the medium heat and put an empty pot on the stove",
                input: "",
                output: "",
            },
            {
                id: 2,
                recipe_id: 1,
                step_order: 2,
                name: "Add oil",
                duration: 3,
                instructions: "Heat the pot for 2 minutes then add in oil",
                input: "",
                output: "",
            },
            {
                id: 3,
                recipe_id: 1,
                step_order: 3,
                name: "Add chicken cubes",
                duration: 10,
                instructions: "Once the oil is hot (about 2 minutes after adding it to pot), carefully add in your main ingredient",
                input: "",
                output: "",
            },
            {
                id: 4,
                recipe_id: 1,
                step_order: 4,
                name: "Cook chicken until light brown",
                duration: 15,
                instructions: "Keep stirring the pot every 4 minutes until the food is cooked",
                input: "",
                output: "",
            },
            {
                id: 5,
                recipe_id: 1,
                step_order: 5,
                name: "Add soy sauce and brown sugar and mix well",
                duration: 7,
                instructions: "Once the food is cooked, add in all your ingredients",
                input: "",
                output: "",
            },
            {
                id: 6,
                recipe_id: 1,
                step_order: 6,
                name: "Cook until no liquid sauce",
                duration: 5,
                instructions: "The food is ready to be served. Once the consistency is to your liking, serve the food in a plate, and remember to turn off the stove.",
                input: "",
                output: "",
            },
        ]
    },
  ];
  