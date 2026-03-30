import { getPageContent, onLinkNavigate, transitionHelper } from "../utils.js";

let closeWatcher = null;

function tryCloseWatcherHack() {
  if (navigator.userAgentData?.platform !== "Android") return;
  if (closeWatcher) return;

  closeWatcher = new CloseWatcher();
  closeWatcher.onclose = () => {
    closeWatcher = null;
    history.back();
  };
}

onLinkNavigate(async ({ toPath, isBack, hasUAVisualTransition }) => {
  tryCloseWatcherHack();

  const content = await getPageContent(toPath);

  const transition = transitionHelper({
    skipTransition: hasUAVisualTransition,
    types: isBack ? ["back"] : [],
    updateDOM() {
      // This is a pretty heavy-handed way to update page content.
      // In production, you'd likely be modifying DOM elements directly,
      // or using a framework.
      // innerHTML is used here just to keep the DOM update super simple.
      document.body.innerHTML = content;
    },
  });
});
