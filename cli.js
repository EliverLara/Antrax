#! /usr/bin/env node

'use strict';

const Listr = require('listr');
const execa = require('execa');
const homeDir = require('home-dir');
const pluginsDir = homeDir('.vim/bundle/');
const autoload = homeDir('.vim/autoload/pathogen.vim');

let updatingPluginsTasks = [];
const tasks = new Listr([
    {
        title: "Getting plugins list",
        task: () => execa.stdout('ls', [pluginsDir]).then(dirs => {
             updatingPluginsTasks = dirs.split('\n').map(dir => {
                let cd =  pluginsDir + dir;
                return {
                    title: `Updating ${dir}`,
                    task: (ctx, task) => execa.stdout('git', ['-C', cd, 'pull'])
                            .catch((err) => {
                                task.title = `${task.title} (or not)`;
                                task.skip(err.stderr.replace(/\n/g, ' '));
                            })
                }
            });
        })
    },
    {
        title: "Updating vim pathogen",
        task: () => execa.stdout('wget', ['-O', autoload, 'https://git.io/vXgMx'])
    },
    {
        title: "Updating vim pathogen plugins",
        task: () => new Listr(updatingPluginsTasks,{concurrent: true}) 
    }
]);

tasks.run().catch(err => {
    console.error(err.stderr);
});
