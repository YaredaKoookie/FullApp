import esbuild from "esbuild";

const isProd = process.env.NODE_ENV === "production";

const options = esbuild.build({
    entryPoints: ["src/server.js"],
    bundle: true,
    platform: "node",
    outfile: "dist/server.js",
    sourcemap: true,
    minify: isProd,
    sourcemap: isProd,
    resolveExtensions: ['.js', '.ts'],
    external: ["express"],
    
})

esbuild.build(options)
.then(data => console.log("Build Successfully"))
.catch(() => process.exit(1));

if(process.argv.includes("--watch")){
   const context =  await esbuild.context(options);
   await context.watch();
   console.log(`\x1b[34mWatching for changes...\x1b[0m`)
}
