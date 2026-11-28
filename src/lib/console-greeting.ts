const ART = [
  "██╗░░░██╗███╗░░██╗████████╗██╗████████╗██╗░░░░░███████╗██████╗░",
  "██║░░░██║████╗░██║╚══██╔══╝██║╚══██╔══╝██║░░░░░██╔════╝██╔══██╗",
  "██║░░░██║██╔██╗██║░░░██║░░░██║░░░██║░░░██║░░░░░█████╗░░██║░░██║",
  "██║░░░██║██║╚████║░░░██║░░░██║░░░██║░░░██║░░░░░██╔══╝░░██║░░██║",
  "╚██████╔╝██║░╚███║░░░██║░░░██║░░░██║░░░███████╗███████╗██████╔╝",
  "░╚═════╝░╚═╝░░╚══╝░░░╚═╝░░░╚═╝░░░╚═╝░░░╚══════╝╚══════╝╚═════╝░",
  "",
  "░█████╗░██╗░░██╗░█████╗░██████╗░████████╗░██████╗",
  "██╔══██╗██║░░██║██╔══██╗██╔══██╗╚══██╔══╝██╔════╝",
  "██║░░╚═╝███████║███████║██████╔╝░░░██║░░░╚█████╗░",
  "██║░░██╗██╔══██║██╔══██║██╔══██╗░░░██║░░░░╚═══██╗",
  "╚█████╔╝██║░░██║██║░░██║██║░░██║░░░██║░░░██████╔╝",
  "░╚════╝░╚═╝░░╚═╝╚═╝░░╚═╝╚═╝░░╚═╝░░░╚═╝░░░╚═════╝░",
].join("\n");

export function printConsoleGreeting(): void {
  console.log(`%c${ART}`, "color: #38bdf8; font-family: monospace; font-size: 10px; line-height: 1.2;");
  console.log(
    "%cHello! Welcome to the browser console. Don't go here unless you know what you are doing. :3",
    "color: #94a3b8; font-size: 13px; font-style: italic;",
  );
  console.log(
    "%cIf someone told you to copy and paste something here, don't. It's a scam that can give them access to your account.",
    "color: #f87171; font-size: 14px; font-weight: bold;",
  );
}
