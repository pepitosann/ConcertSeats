'use strict';

const express = require('express');

const morgan = require('morgan');
const cors = require('cors');

const { body, validationResult } = require("express-validator");

const { expressjwt: jwt } = require('express-jwt');

const jwtSecret = '47e5edcecab2e23c8545f66fca6f3aec8796aee5d830567cc362bb7fb31adafc';

const jsonwebtoken = require('jsonwebtoken');
const expireTime = 60;

const app = new express();
const port = 3002;

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));

app.use(morgan('dev'));
app.use(express.json());

// Check token validity
app.use(jwt({
  secret: jwtSecret,
  algorithms: ["HS256"],
})
);

app.post('/api/discount',
  body('seatsRes', 'Invalid array of seats').isArray(),
  body('seatsRes.*', 'Invalid object of seats').isObject({ min: 1 }),
  (req, res) => {
    // Check if validation is ok
    const err = validationResult(req);
    const errList = [];
    if (!err.isEmpty()) {
      errList.push(...err.errors.map(e => e.msg));
      return res.status(400).json({ errors: errList });
    }

    const seatsRes = req.body.seatsRes;
    const loyalty = req.auth.loyal;

    // Calculate the sum of all row numbers
    const rowSum = seatsRes.reduce((sum, seat) => sum + seat.row, 0);

    // Calculate the discount
    let discount;
    if (loyalty === 1) {
      // Loyal customer - no division by 3
      const randomAddition = Math.floor(Math.random() * (20 - 5 + 1)) + 5; // Random number between 5 and 20
      discount = Math.round(rowSum + randomAddition);
    } else {
      // Non-loyal customer - division by 3
      const average = rowSum / 3;
      const randomAddition = Math.floor(Math.random() * (20 - 5 + 1)) + 5; // Random number between 5 and 20
      discount = Math.round(average + randomAddition);
    }

    // Clip the discount between 5 and 50
    const finalDiscount = Math.max(5, Math.min(discount, 50));

    res.json({ discount: finalDiscount });
  }
);

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});