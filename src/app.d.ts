declare global {
	namespace App {
		interface Error {
			message: string;
			// the server rendered it without the viewer's session, so a signed-in browser should load it again
			needsSession?: boolean;
		}
		interface Locals {
			lang: string;
			discord: boolean;
		}
	}
	interface Window {
		adsbygoogle?: { push(params: object): void };
	}
}

export {};
