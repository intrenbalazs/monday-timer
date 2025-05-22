# Monday Timer

An Electron application that loads a specified URL from a .env file. The application is designed to work with Monday.com and includes custom protocol handling.

## Features

- Loads a configurable URL from a .env file
- Custom protocol handling (`monday-timer://`)
- Cross-platform (Windows, macOS, Linux)

## Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

## Configuration

The application loads a URL from the `.env` file. You can modify this file to change the URL that the application loads:

```
URL=https://monday.com/
```

## Running the Application

To run the application in development mode:

```bash
npm start
```

## Testing the Configuration

To verify that the application is configured correctly:

```bash
npm test
```

This will check that all required files and configurations are in place.

## Building for Distribution

To build the application for distribution:

```bash
npm run build
```

This will create platform-specific installers in the `dist` directory.

## Custom Protocol

The application registers a custom protocol `monday-timer://`. This allows you to create links that open the application, for example:

```
monday-timer://open
```

You can use this feature to integrate the application with other systems or to create desktop shortcuts.

## Icons

The application uses icons from the `icons` directory. The following icon sizes are included:

- 16x16
- 32x32
- 96x96
- 180x180
- 192x192
- 512x512

## License

ISC
