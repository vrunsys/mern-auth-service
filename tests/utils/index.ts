export const isJwt = (token: string | null) => {
	if (!token) {
		return false;
	}
	const parts = token.split(".");
	if (parts.length !== 3) {
		return false;
	}
	try {
		parts.forEach((part) => {
			Buffer.from(part, "base64").toString("utf-8");
		});
		return true;
	} catch (_e) {
		return false;
	}
};

export const getCookieValue = (
	headers: Record<string, string[] | string | undefined>,
	name: string,
) => {
	const cookies = headers["set-cookie"] || [];
	const cookieList = Array.isArray(cookies) ? cookies : [cookies];
	const cookie = cookieList.find((value) => value.startsWith(`${name}=`));

	return cookie?.split(";")[0].split("=")[1] || null;
};
