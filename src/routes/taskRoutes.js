

const express = require('express');

const Task = require('../models/tasks');
const User = require('../models/user');
const auth = require('../middleware/auth');

const router = new express.Router();


router.get('/tasks', auth, async (req, res, next) => {
    const match = {};
    const sort = {};

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    try {

        const tasks = await Task.find({ ...match, owner: req.user._id }, null, { limit: parseInt(req.query.limit), skip: parseInt(req.query.skip), sort })
        // await req.user.populate('tasks').execPopulate()


        // const tasks = await Task.find();
        res.status(200).send(tasks)

    } catch (error) {
        res.status(500).send({ error: 'cannot load user tasks' })
    }

    // Task.find().then((tasks) => {
    //     console.log(tasks);
    //     res.status(200).send(tasks);
    // }).catch((e) => res.status(500).send(e))
})

router.get('/tasks/:taskId', auth, async (req, res, next) => {
    const _id = req.params.taskId;

    try {
        const task = await Task.findOne({ _id, owner: req.user._id })

        res.status(200).send(task);

    } catch (error) {
        res.status(400).send({ error: 'cannot find task or user' })
    }



    // Task.find({ id }).then((tasks) => {
    //     console.log(tasks[0]);
    //     res.status(200).send(tasks[0]);
    // }).catch((e) => res.status(500).send(e))
})


router.post('/tasks', auth, async (req, res, next) => {
    const task = new Task({ ...req.body, owner: req.user._id });

    try {
        await task.save();
        res.status(201).send(task)

    } catch (error) {
        res.status(400).send()

    }

});

router.patch('/tasks/:taskId', auth, async (req, res) => {
    const id = req.params.taskId;

    const updates = Object.keys(req.body);
    const validUpdates = ['description', 'completed'];
    const isValidUpdates = updates.every(update => validUpdates.includes(update));

    if (!isValidUpdates) {
        return res.status(404).send({ error: 'invalid fields' })
    }
    try {
        // const task = await Task.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

        const task = await Task.findByIdAndUpdate({ _id: id, owner: req.user._id });

        if (!task) {
            return res.status(404).send();

        }

        updates.forEach((update) => task[update] = req.body[update])

        await task.save();

        res.status(200).send(task)
    } catch (error) {
        res.status(400).send('task not updated')

    }
});

router.delete('/tasks/:taskId', auth, async (req, res) => {
    const id = req.params.taskId;

    try {
        const task = await Task.findByIdAndDelete({ _id: id, owner: req.user._id })

        if (!task) {
            return res.status(404).send({ error: 'task does not exist' })
        }
        await req.user.save();

        res.status(200).send('deleted')
    } catch (error) {
        res.status(500).send(error)
    }
})

module.exports = router; 