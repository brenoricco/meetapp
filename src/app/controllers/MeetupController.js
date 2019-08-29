import * as Yup from 'yup';
import { startOfHour, isBefore, parseISO } from 'date-fns';
import Meetup from '../models/Meetup';

class MeetupController {
  async index(req, res) {
    const meetups = await Meetup.findAll({ where: { user_id: req.userId } });

    if (!meetups) {
      return res.status(401).json({ error: "You don't have meetups" });
    }

    return res.json(meetups);
  }

  async store(req, res) {
    /**
     * Validando dados req.body
     */
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required(),
      banner: Yup.string(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { title, description, location, date, banner } = req.body;

    /**
     * Verifica se o valor de date é menor que a data atual
     */
    const hourStart = startOfHour(parseISO(date));
    if (isBefore(hourStart, new Date())) {
      return res.status(401).json({ error: 'Past dates are not permited' });
    }

    const user_id = req.userId;

    const meetup = await Meetup.create({
      title,
      description,
      location,
      date,
      banner,
      user_id,
    });

    return res.json(meetup);
  }

  async update(req, res) {
    /**
     * Validando dados req.body
     */
    const schema = Yup.object().shape({
      title: Yup.string(),
      description: Yup.string(),
      location: Yup.string(),
      date: Yup.date(),
      banner: Yup.string(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    /**
     * Verifica se existe um meetup com id informado
     */
    const meetupExists = await Meetup.findByPk(req.params.id);

    if (!meetupExists) {
      return res.status(401).json({ error: 'Meetup not found' });
    }

    /**
     * Verifica se o usuario logado é o organizador do meetup
     */

    if (meetupExists.user_id !== req.userId) {
      return res
        .status(401)
        .json({ error: 'You not permission to update this meetup' });
    }

    /**
     * Verifica se a data do meetup já passou
     */
    const { date } = meetupExists;

    const hourStart = startOfHour(parseISO(date));
    if (isBefore(hourStart, new Date())) {
      return res.status(401).json({ error: 'Past dates are not permited' });
    }

    const meetup = await meetupExists.update(req.body);

    return res.json(meetup);
  }

  async delete(req, res) {
    const { id } = req.params;

    const meetup = await Meetup.findByPk(id);

    if (!meetup) {
      return res.status(401).json({ error: 'Meetup not found' });
    }

    if (meetup.user_id !== req.userId) {
      return res
        .status(401)
        .json({ error: 'You not permission to delete this meetup' });
    }

    await Meetup.destroy({ where: { id } });

    return res.json({ message: `Meetup: ${id} successfully deleted` });
  }
}

export default new MeetupController();
