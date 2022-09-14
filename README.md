# typescript-boilerplate-package

`typescript-boilerplate-package` is a package that helps you to create a typescript project with a nice structure. It uses [semantic-release](https://github.com/semantic-release/semantic-release) to publish your package on npm and generate a changelog.

## Usage

After cloning this repository or using it as a template, you have to follow these steps:

1. Grant permission of your repository to allow `semantic-release` to change dynamically the version of the package.

![Alt Text](https://raw.githubusercontent.com/maxgfr/typescript-boilerplate-package/main/.github/assets/permissions.png)

2. Set `NPM_TOKEN` in your Github actions secret.

![Alt Text](https://raw.githubusercontent.com/maxgfr/typescript-boilerplate-package/main/.github/assets/token.png)

## Test this boilerplate

To test it, you can install it with `npm install typescript-boilerplate-package`. Then :

```ts
import {sayHello} from "typescript-boilerplate-package";
sayHello();
```
