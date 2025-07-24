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
                instructions: "",
                input: "",
                output: "",
            },
            {
                id: 2,
                recipe_id: 1,
                step_order: 2,
                name: "Add oil",
                duration: 3,
                instructions: "",
                input: "",
                output: "",
            },
            {
                id: 3,
                recipe_id: 1,
                step_order: 3,
                name: "Add chicken cubes",
                duration: 10,
                instructions: "",
                input: "",
                output: "",
            },
            {
                id: 4,
                recipe_id: 1,
                step_order: 4,
                name: "Cook chicken until light brown",
                duration: 15,
                instructions: "",
                input: "",
                output: "",
            },
            {
                id: 5,
                recipe_id: 1,
                step_order: 5,
                name: "Add soy sauce and brown sugar and mix well",
                duration: 7,
                instructions: "",
                input: "",
                output: "",
            },
            {
                id: 6,
                recipe_id: 1,
                step_order: 6,
                name: "Cook until no liquid sauce",
                duration: 5,
                instructions: "",
                input: "",
                output: "",
            },
        ]
    },
  ];
  