# Static Starter

Clone the repo and run the following commands  

`npm install`  
`npm run dev`    

You can also run `npm run watch` to build the site assets, and then automatically build any files you may save moving forward.  

## Production Build

Run `npm run prod` to generate a manifest file to point to the latest versions of assets. This will create an `assets.json` file in `/dist` (Only really useful if you intend on using some sort of server-side processing to reference the stylesheet / javascript).

## Automations  

Gulp will automagically compress fonts / images / sass / javascript and move them into the `dist` folder.  

You can run individual tasks by executing the following commands:  

`gulp clean` - removes the `dist` folder  
`gulp images` - compresses and moves images to the `dist/img` folder  
`gulp fonts` - moves fonts to the `dist/fonts` folder  
`gulp styles`  - compiles sass, compresses and includes and css you want and moves it all to the `dist/css` folder  
`gulp js` - compiles js, includes any js from node_modules you have specified (see gulp file) and moves it to `dist/js`
