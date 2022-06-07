import Mongoose from "./database";
import { Examination } from "./examination";
import { Shop } from "./shop";
import { Test } from "./test";
import { User } from "./user";

import * as fs from "fs";
import argon2 from "argon2";
import shortid from "shortid";
import { faker } from "@faker-js/faker";

function generate_wards(seed: number, ward_count: number) {
    faker.seed(seed);
    const wards: string[] = [];
    for (let i = 0; i < ward_count; i++) {
        wards.push(faker.address.street());
    }
    return wards;
}

function generage_users(
    seed: number,
    wards: string[],
    default_password: string
) {
    faker.seed(seed);

    const user_count = parseInt(faker.random.numeric(2)) + 1;
    const users: User[] = [];
    const flags = [1, 2, 3];

    users.push({
        _id: shortid.generate(),
        email: "admin@admin.com",
        password: default_password,
        ward: "Admin Ward",
        firstName: "Ad",
        lastName: "Min",
        permissionFlags: 3,
    });

    for (let i = 0; i < user_count; i++) {
        const user: User = {
            _id: shortid.generate(),
            email: faker.internet.email(),
            password: default_password,
            ward: wards[parseInt(faker.random.numeric(5)) % wards.length],
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            permissionFlags:
                flags[parseInt(faker.random.numeric(5)) % flags.length],
        };
        users.push(user);
    }

    return users;
}

function generate_shops(seed: number, wards: string[]) {
    faker.seed(seed);

    const shop_count = parseInt(faker.random.numeric(2)) + 1;
    const shops: Shop[] = [];
    const shop_types = ["Quán bán thực phẩm", "Cơ sở chế biến thực phẩm"];

    for (let i = 0; i < shop_count; i++) {
        // 0 -> Not issued | 1 -> Issued | 2 -> Outdated | 3 -> Canceled
        const cert_types = parseInt(faker.random.numeric(5)) % 4;
        let isValid = undefined;
        let validBefore = undefined; //faker.date.future()
        if (cert_types === 0) {
            isValid = undefined;
            validBefore = undefined;
        }
        if (cert_types === 1) {
            isValid = true;
            validBefore = faker.date.future();
        }
        if (cert_types === 2) {
            isValid = false;
            validBefore = faker.date.past();
        }
        if (cert_types === 3) {
            isValid = false;
            validBefore = faker.date.past();
        }
        const shop: Shop = {
            _id: shortid.generate(),
            name: faker.company.companyName(),
            address: faker.address.streetAddress(),
            ward: wards[parseInt(faker.random.numeric(5)) % wards.length],
            phone: faker.phone.phoneNumber("0#########"),
            type: shop_types[
                parseInt(faker.random.numeric(5)) % shop_types.length
            ],
            isValid: isValid,
            validBefore: validBefore,
        };
        shops.push(shop);
    }

    return shops;
}

function generate_examinations(seed: number, shops: Shop[]) {
    faker.seed(seed);

    const examination_count = parseInt(faker.random.numeric(2)) + 1;
    const examinations: Examination[] = [];
    const status = [
        "Kiểm tra tại cơ sở",
        "Lấy mẫu và kiểm định",
        "Kết luận",
        "Xử lý",
    ];

    for (let i = 0; i < examination_count; i++) {
        const examination: Examination = {
            _id: shortid.generate(),
            from: faker.date.past(),
            to: faker.date.future(),
            shop_id:
                shops[parseInt(faker.random.numeric(5)) % shops.length]._id,
            status: status[parseInt(faker.random.numeric(5)) % status.length],
            test_id: shortid.generate(),
        };
        examinations.push(examination);
    }

    return examinations;
}

function generate_tests(seed: number, examinations: Examination[]) {
    const tests: Test[] = [];
    const status = ["Đang xử lý", "Đã xử lý"];
    const result = ["Không đạt", "Đạt"];

    for (let i = 0; i < examinations.length; i++) {
        const taken = faker.date.between(
            examinations[i].from,
            examinations[i].to
        );
        const test: Test = {
            _id: examinations[i].test_id,
            taken: taken,
            status: status[parseInt(faker.random.numeric(5)) % status.length],
            result: result[parseInt(faker.random.numeric(5)) % result.length],
            processing_unit: faker.company.companyName(),
            result_date: faker.date.between(taken, examinations[i].to),
        };
        tests.push(test);
    }

    return tests;
}

function writeDataToFile(
    users: { data: User[] },
    shops: { data: Shop[] },
    examinations: { data: Examination[] },
    tests: { data: Test[] }
) {
    fs.writeFileSync(
        "./data/users.json",
        JSON.stringify(users, null, 4),
        "utf8"
    );
    fs.writeFileSync(
        "./data/shops.json",
        JSON.stringify(shops, null, 4),
        "utf8"
    );
    fs.writeFileSync(
        "./data/examinations.json",
        JSON.stringify(examinations, null, 4),
        "utf8"
    );
    fs.writeFileSync(
        "./data/tests.json",
        JSON.stringify(tests, null, 4),
        "utf8"
    );
}

async function writeDataToDB(
    users: { data: User[] },
    shops: { data: Shop[] },
    examinations: { data: Examination[] },
    tests: { data: Test[] }
) {
    await Mongoose.clearCollections();
    const Schema = Mongoose.getMongoose().Schema;
    const UserSchema = new Schema(
        {
            _id: String,
            email: String,
            password: { type: String, select: false },
            ward: String,
            firstName: String,
            lastName: String,
            permissionFlags: Number,
        },
        { id: false }
    );
    const ShopSchema = new Schema(
        {
            _id: String,
            name: String,
            address: String,
            ward: String,
            phone: String,
            type: String,
            isValid: Boolean,
            validBefore: Date,
        },
        { id: false }
    );
    const ExaminationSchema = new Schema(
        {
            _id: String,
            from: Date,
            to: Date,
            shop_id: String,
            status: String,
            test_id: String,
        },
        { id: false }
    );
    const TestSchema = new Schema(
        {
            _id: String,
            taken: Date,
            status: String,
            result: String,
            processing_unit: String,
            result_date: Date,
        },
        { id: false }
    );

    const ShopDB = Mongoose.getMongoose().model("Shops", ShopSchema);
    const UserDB = Mongoose.getMongoose().model("Users", UserSchema);
    const ExaminationDB = Mongoose.getMongoose().model(
        "Examinations",
        ExaminationSchema
    );
    const TestDB = Mongoose.getMongoose().model("Tests", TestSchema);

    for (let i = 0; i < users.data.length; i++) {
        const user = new UserDB(users.data[i]);
        await user.save();
    }
    for (let i = 0; i < shops.data.length; i++) {
        const shop = new ShopDB(shops.data[i]);
        await shop.save();
    }
    for (let i = 0; i < examinations.data.length; i++) {
        const examination = new ExaminationDB(examinations.data[i]);
        await examination.save();
    }
    for (let i = 0; i < tests.data.length; i++) {
        const test = new TestDB(tests.data[i]);
        await test.save();
    }
}

async function generate(
    seed: number,
    password: string,
    writeToFile: boolean,
    writeToDB: boolean
) {
    faker.seed(seed);

    const default_password = await argon2.hash(password);
    const ward_count = parseInt(faker.random.numeric(2)) + 1;
    const wards = generate_wards(seed * 2, ward_count);
    const users = { data: generage_users(seed * 3, wards, default_password) };
    const shops = { data: generate_shops(seed * 4, wards) };
    const examinations = { data: generate_examinations(seed * 5, shops.data) };
    const tests = { data: generate_tests(seed * 6, examinations.data) };

    if (writeToFile) {
        writeDataToFile(users, shops, examinations, tests);
        console.log("Data generated and written to file");
    }

    if (writeToDB) {
        await writeDataToDB(users, shops, examinations, tests);
        console.log("Data generated and written to db");
    }

    await Mongoose.getMongoose().connection.close();
    console.log("DONE!");
}

let db = false,
    file = false;
if (process.argv.includes("-db")) {
    db = true;
}
if (process.argv.includes("-file")) {
    file = true;
}
if (process.argv.includes("-seed")) {
    try {
        const seed = parseInt(process.argv[process.argv.indexOf("-seed") + 1]);
        if (isNaN(seed)) {
            throw new Error("Seed is not a number");
        }
        generate(seed, "admin", file, db);
    } catch (error) {
        console.log("Invalid seed");
    }
} else {
    generate(0, "admin", file, db);
}
