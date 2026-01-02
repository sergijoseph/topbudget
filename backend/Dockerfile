# This is the parent image
FROM node:25-alpine

# Specify the working directory
WORKDIR /app

#Copy json files from source folder to image folder
COPY package.json .

# Install node modules. Use RUN only for installing files during image build stage
RUN npm install

#Copy app files from source folder to image folder
COPY . .

# Specify the port exposed by this image/container
EXPOSE 80

# start node app. Use CMD command only when running an image as a container
CMD ["npm", "run", "start"]
