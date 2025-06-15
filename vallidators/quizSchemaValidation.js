export const quizSchemaValidation = {
  title: {
    exists: {
      errorMessage: "Title is required",
    },
    notEmpty: {
      errorMessage: "Title should not be empty",
    },
    trim: true,
  },

  description: {
    exists: {
      errorMessage: "Description is required",
    },
    notEmpty: {
      errorMessage: "Description should not be empty",
    },
    trim: true,
  },

  questions: {
    isArray: {
      options: { min: 1 },
      errorMessage: "At least one question is required",
    },
  },

  

  "questions.*.question_text": {
    exists: {
      errorMessage: "Question text is required",
    },
    notEmpty: {
      errorMessage: "Question text should not be empty",
    },
  },

  "questions.*.options": {
    isArray: {
      options: { min: 1 },
      errorMessage: "Each question must have at least one option",
    },
  },

 

  "questions.*.options.*.option_text": {
    exists: {
      errorMessage: "Option text is required",
    },
    notEmpty: {
      errorMessage: "Option text should not be empty",
    },
  },

  total_points: {
    exists: {
      errorMessage: "Total points are required",
    },
    isNumeric: {
      errorMessage: "Total points must be a number",
    },
  },

  quiz_type: {
    optional: true,
    isIn: {
      options: [["multiple_choice", "true_false", "open_ended"]],
      errorMessage: "Quiz type must be one of: multiple_choice, true_false, open_ended",
    },
  },
};
export const quizUpdateValidation = {
  title: {
    in: ['body'],
    optional: true,
    notEmpty: { errorMessage: "Title should not be empty" },
  },
  description: {
    in: ['body'],
    optional: true,
    notEmpty: { errorMessage: "Description should not be empty" },
  },
  questions: {
    in: ['body'],
    optional: true,
    isArray: { options: { min: 1 }, errorMessage: "At least one question is required" },
  },
 
  'questions.*.question_text': {
    in: ['body'],
    optional: true,
    notEmpty: { errorMessage: "Question text should not be empty" },
  },
  'questions.*.options': {
    in: ['body'],
    optional: true,
    isArray: { options: { min: 1 }, errorMessage: "Each question must have options" },
  },
 
  'questions.*.options.*.option_text': {
    in: ['body'],
    optional: true,
    notEmpty: { errorMessage: "Option text should not be empty" },
  },
  total_points: {
    in: ['body'],
    optional: true,
    isNumeric: { errorMessage: "Total points must be a number" },
  },
};
