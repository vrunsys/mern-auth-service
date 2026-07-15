import { checkSchema } from "express-validator";

export default checkSchema({
	name: {
		trim: true,
		errorMessage: "tenant name is required",
		notEmpty: true,
	},
	address: {
		trim: true,
		errorMessage: "tenant address is required",
		notEmpty: true,
	},
});
