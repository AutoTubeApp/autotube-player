# Autotube Player

This player will be loaded in an iframe through the index.html file.  
The index.html file will be included in each video package created by Autotube app.  
This file contains minimal markup, it will load external JS which will dynamically build the page adding extra
markup, css, and handle video player.

=> With this solution we can:
- have homogenous player for all videos and users.
- update the player without having to update the app.
- play video everywhere without taking care of the fuck**g CORS policy.

## Dev

```bash
npm install 
npm run dev
```

Build:
```bash
npm run build
```


