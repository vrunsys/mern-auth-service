import { checkSchema } from "express-validator";
import { Role } from "../constants/index.ts";

export default checkSchema({
	role: {
		optional: true,
		isIn: {
			options: [[Role.MANAGER, Role.ADMIN]],
			errorMessage: "Role must be manager or admin",
		},
	},
});
