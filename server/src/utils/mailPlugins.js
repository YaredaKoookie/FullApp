import fs from "fs";
import juice from "juice";
import path from "path";
import { compileFile } from "pug";
// Compile Pug templates into HTML

export const compilePug = () => {
  return (mail, callback) => {
    // We assume `data` exists and may contain custom keys
    const data = mail.data;
    const {
      template,
      locals
    } = data;
    if (!template) return callback(new Error("Missing template in mail.data"));
    const templatePath = path.resolve("./src/emails", `${template}.pug`);
    if (!fs.existsSync(templatePath)) {
      return callback(new Error("Pug template not found at " + templatePath));
    }
    const compile = compileFile(templatePath);
    const html = compile(locals || {});
    data.html = html;
    callback();
  };
};

// Inline CSS styles using Juice
export const inlineCssStyles = (resourceFolder = "./public") => {
  return async (mail, callback) => {
    try {
      const data = mail.data;
      const inlinedHtml = await new Promise((resolve, reject) => {
        juice.juiceResources(typeof data.html === "string" ? data.html : "", {
          webResources: {
            relativeTo: path.resolve(resourceFolder),
            images: false
          }
        }, (err, result) => {
          if (err) reject(err);else resolve(result);
        });
      });
      data.html = inlinedHtml;
      callback();
    } catch (error) {
      callback(error);
    }
  };
};