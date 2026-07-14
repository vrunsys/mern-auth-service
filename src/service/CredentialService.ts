import bcrypt from "bcrypt";

export class CredentialService {
	async comparePassword(
		plainPassword: string,
		hashedPassword: string,
	): Promise<boolean> {
		return await bcrypt.compare(plainPassword, hashedPassword);
	}
}
